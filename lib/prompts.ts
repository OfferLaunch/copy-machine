import { COPY_TYPES, type CopyTypeId } from "./offers";
import type { StoredOffer } from "./offers-storage";
import type { Swipe } from "./swipes-storage";
import type { FeedbackEntry } from "./feedback-storage";
import type { KnowledgeDoc } from "./knowledge-storage";

const SYSTEM_RULES = `You are an elite direct-response copywriter. You write like the best in the game. Think Gary Halbert meets GQ editorial.

ABSOLUTE RULES - BREAK THESE AND YOU'RE FIRED:
- NEVER use these words/phrases: "leveraging", "tapestry", "journey", "landscape", "synergy", "navigating", "unlock", "game-changer", "cutting-edge", "revolutionize", "seamless", "robust", "innovative", "transform your", "imagine a world", "in today's fast-paced"
- NEVER use em dashes (—), en dashes (–), or long dashes. Use periods, commas, or line breaks instead.
- NEVER start with corny intros like "Are you tired of..." or "What if I told you..."
- NEVER use corporate buzzwords or MBA-speak
- NEVER sound like AI wrote this. If it reads like ChatGPT, rewrite it.

VOICE AND STYLE:
- Short punchy sentences. Then longer ones when you need to build momentum.
- GQ/Esquire editorial voice. Confident. Direct. A little dangerous.
- Frameworks not scripts. Give bare-bones, actionable structure.
- Write for high-ticket ($10K-50K price points). These buyers are sophisticated. Don't talk down to them.
- Raw and direct. No fluff. Every sentence earns its place.
- Use line breaks aggressively. White space is your friend.
- Contractions are fine. Write like you talk.
- Be specific with numbers and results. Vague claims are weak claims.`;

function buildSwipeContext(swipes: Swipe[]): string {
  if (!swipes || swipes.length === 0) return "";

  const parts: string[] = [];
  let i = 1;
  for (const s of swipes) {
    const tagStr = s.tags?.length ? ` [Tags: ${s.tags.join(", ")}]` : "";
    if (s.type === "text" && s.content) {
      parts.push(`--- REFERENCE ${i}${tagStr} ---\n${s.content}`);
      i++;
    } else if (s.type === "image") {
      parts.push(`--- REFERENCE ${i}${tagStr} ---\n[Reference image available: ${s.title || "uploaded image"}]`);
      i++;
    } else if (s.type === "link" && s.content) {
      parts.push(`--- REFERENCE ${i}${tagStr} (from ${s.linkUrl}) ---\n${s.content}`);
      i++;
    }
  }
  if (parts.length === 0) return "";
  return `\n\nHere are approved reference swipes for this offer. Match this quality and style:\n\n${parts.join("\n\n")}`;
}

export function buildPrompt(params: {
  offer: StoredOffer;
  copyTypeId: CopyTypeId;
  customDetails?: string;
  promo?: string;
  avatar?: string;
  angle?: string;
  swipeExamples?: string[];
  swipes?: Swipe[];
  customPrompt?: string;
  customParams?: { pieces?: number; tone?: string; length?: string; otherDetails?: string };
  feedbackEntries?: FeedbackEntry[];
  knowledgeDocs?: KnowledgeDoc[];
}) {
  const { offer } = params;
  const copyType = COPY_TYPES.find((c) => c.id === params.copyTypeId)!;

  let system = SYSTEM_RULES;

  // New enhanced swipes
  if (params.swipes && params.swipes.length > 0) {
    system += buildSwipeContext(params.swipes);
  } else if (params.swipeExamples && params.swipeExamples.length > 0) {
    // Legacy fallback
    system += `\n\nHere are approved examples of copy for this offer that the team liked. Match this quality and style:\n\n${params.swipeExamples.map((s, i) => `--- EXAMPLE ${i + 1} ---\n${s}`).join("\n\n")}`;
  }

  if (offer.trainingMaterial) {
    system += `\n\nTRAINING MATERIAL FOR THIS OFFER (use this as context, tone reference, and source material):\n${offer.trainingMaterial}`;
  }

  // Feedback entries - learned style preferences
  if (params.feedbackEntries && params.feedbackEntries.length > 0) {
    const fbLines = params.feedbackEntries.map((e) => `- ${e.feedback}${e.context ? ` (re: ${e.context.slice(0, 100)})` : ""}`).join("\n");
    system += `\n\nSTYLE PREFERENCES (learned from previous feedback for this offer):\n${fbLines}`;
  }

  // Knowledge docs - reference material
  if (params.knowledgeDocs && params.knowledgeDocs.length > 0) {
    const knowledgeText = params.knowledgeDocs.map((d) => `### ${d.title}${d.category ? ` [${d.category}]` : ""}\n${d.content}`).join("\n\n");
    system += `\n\nREFERENCE MATERIAL:\n\n${knowledgeText}`;
  }

  const isCustom = !!params.customPrompt;

  let userPrompt = `OFFER: ${offer.name}
DESCRIPTION: ${offer.description}
PRICE RANGE: ${offer.priceRange}
DEFAULT AVATAR: ${offer.avatar}

${isCustom ? `CUSTOM REQUEST: ${params.customPrompt}` : `COPY TYPE: ${copyType.name}\nTASK: ${copyType.description}`}`;

  if (isCustom && params.customParams) {
    const cp = params.customParams;
    if (cp.pieces) userPrompt += `\nNUMBER OF PIECES: ${cp.pieces}`;
    if (cp.tone) userPrompt += `\nTONE: ${cp.tone}`;
    if (cp.length) userPrompt += `\nLENGTH: ${cp.length}`;
    if (cp.otherDetails) userPrompt += `\nADDITIONAL PARAMETERS: ${cp.otherDetails}`;
  }

  if (params.customDetails) userPrompt += `\n\nADDITIONAL DETAILS: ${params.customDetails}`;
  if (params.promo) userPrompt += `\n\nCURRENT PROMO/OFFER: ${params.promo}`;
  if (params.avatar) userPrompt += `\n\nCUSTOM TARGET AVATAR: ${params.avatar}`;
  if (params.angle) userPrompt += `\n\nSPECIFIC ANGLE/HOOK: ${params.angle}`;

  userPrompt += `\n\nWrite the ${isCustom ? "requested copy" : copyType.name} now. No preamble. No explanation. Just the copy.`;

  return { system, user: userPrompt };
}

export function getModelForType(copyTypeId: CopyTypeId): string {
  const ct = COPY_TYPES.find((c) => c.id === copyTypeId);
  return ct && "useOpus" in ct && ct.useOpus ? "claude-sonnet-4-20250514" : "claude-sonnet-4-20250514";
}
