import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, getModelForType } from "@/lib/prompts";
import type { OfferId, CopyTypeId } from "@/lib/offers";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offerId, copyTypeId, customDetails, promo, avatar, angle } = body as {
      offerId: OfferId;
      copyTypeId: CopyTypeId;
      customDetails?: string;
      promo?: string;
      avatar?: string;
      angle?: string;
    };

    if (!offerId || !copyTypeId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { system, user } = buildPrompt({ offerId, copyTypeId, customDetails, promo, avatar, angle });
    const model = getModelForType(copyTypeId);

    const stream = client.messages.stream({
      model,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: user }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
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
