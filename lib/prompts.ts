import { OFFERS, COPY_TYPES, type OfferId, type CopyTypeId } from "./offers";

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

export function buildPrompt(params: {
  offerId: OfferId;
  copyTypeId: CopyTypeId;
  customDetails?: string;
  promo?: string;
  avatar?: string;
  angle?: string;
}) {
  const offer = OFFERS.find((o) => o.id === params.offerId)!;
  const copyType = COPY_TYPES.find((c) => c.id === params.copyTypeId)!;

  let userPrompt = `OFFER: ${offer.name}
DESCRIPTION: ${offer.description}
PRICE RANGE: ${offer.priceRange}
DEFAULT AVATAR: ${offer.avatar}

COPY TYPE: ${copyType.name}
TASK: ${copyType.description}`;

  if (params.customDetails) userPrompt += `\n\nADDITIONAL DETAILS: ${params.customDetails}`;
  if (params.promo) userPrompt += `\n\nCURRENT PROMO/OFFER: ${params.promo}`;
  if (params.avatar) userPrompt += `\n\nCUSTOM TARGET AVATAR: ${params.avatar}`;
  if (params.angle) userPrompt += `\n\nSPECIFIC ANGLE/HOOK: ${params.angle}`;

  userPrompt += `\n\nWrite the ${copyType.name} now. No preamble. No explanation. Just the copy.`;

  return { system: SYSTEM_RULES, user: userPrompt };
}

export function getModelForType(copyTypeId: CopyTypeId): string {
  const ct = COPY_TYPES.find((c) => c.id === copyTypeId);
  return ct && "useOpus" in ct && ct.useOpus ? "claude-3-5-sonnet-20241022" : "claude-3-5-sonnet-20241022";
}
