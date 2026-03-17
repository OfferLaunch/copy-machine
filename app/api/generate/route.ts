import { NextRequest } from "next/server";
import { buildPrompt, getModelForType } from "@/lib/prompts";
import { getOffer } from "@/lib/offers-storage";
import { getSwipesForOffer } from "@/lib/swipes-storage";
import { getFeedbackForOffer } from "@/lib/feedback-storage";
import { getKnowledgeForGeneration } from "@/lib/knowledge-storage";
import type { CopyTypeId } from "@/lib/offers";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offerId, copyTypeId, customDetails, promo, avatar, angle, previousOutput, selectedText, sectionFeedback, mode, customPrompt, customParams } = body as {
      offerId: string;
      copyTypeId: CopyTypeId;
      customDetails?: string;
      promo?: string;
      avatar?: string;
      angle?: string;
      previousOutput?: string;
      selectedText?: string;
      sectionFeedback?: string;
      mode?: "full" | "section";
      customPrompt?: string;
      customParams?: { pieces?: number; tone?: string; length?: string; otherDetails?: string };
    };

    if (!offerId || !copyTypeId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const offer = await getOffer(offerId);
    if (!offer) {
      return Response.json({ error: "Offer not found" }, { status: 404 });
    }

    const swipes = await getSwipesForOffer(offerId, copyTypeId === "custom" ? undefined as any : copyTypeId);
    const feedbackEntries = await getFeedbackForOffer(offerId, 10);
    const knowledgeDocs = await getKnowledgeForGeneration(offerId, copyTypeId === "custom" ? undefined : copyTypeId);
    let system: string;
    let user: string;

    if (mode === "section" && previousOutput && selectedText && sectionFeedback) {
      const prompt = copyTypeId === "custom"
        ? buildPrompt({ offer, copyTypeId: "ads", customDetails, promo, avatar, angle, swipes, customPrompt, customParams, feedbackEntries, knowledgeDocs })
        : buildPrompt({ offer, copyTypeId, customDetails, promo, avatar, angle, swipes, feedbackEntries, knowledgeDocs });
      system = prompt.system;
      user = `Here is copy that was previously generated:\n\n${previousOutput}\n\nThe user has highlighted this specific section:\n"${selectedText}"\n\nTheir feedback on this section: ${sectionFeedback}\n\nRewrite the ENTIRE copy, but ONLY change the highlighted section based on the feedback. Everything else must remain exactly the same word-for-word.`;
    } else if (copyTypeId === "custom" && customPrompt) {
      const prompt = buildPrompt({ offer, copyTypeId: "ads", customDetails, promo, avatar, angle, swipes, customPrompt, customParams, feedbackEntries, knowledgeDocs });
      system = prompt.system;
      user = prompt.user;
    } else {
      const prompt = buildPrompt({ offer, copyTypeId, customDetails, promo, avatar, angle, swipes, feedbackEntries, knowledgeDocs });
      system = prompt.system;
      user = prompt.user;
    }

    const model = getModelForType(copyTypeId === "custom" ? "ads" : copyTypeId);

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        stream: true,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return Response.json({ error: `API ${apiRes.status}: ${errText}` }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = apiRes.body!.getReader();

    const readable = new ReadableStream({
      async start(controller) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
              } catch {}
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
