export const OFFERS = [
  {
    id: "ex",
    name: "Ecom Accelerator (EX)",
    description: "eBay/Walmart managed ecommerce stores. Done-for-you product sourcing, listing optimization, and store management. Clients buy a fully managed store that generates passive income.",
    priceRange: "$15,000 - $35,000",
    avatar: "Aspiring entrepreneurs, 30-55, with $15-35K capital. Want passive income without building a business from scratch. Often professionals or retirees looking for cash flow.",
  },
  {
    id: "ae",
    name: "Algo Exchange (AE)",
    description: "Automated futures trading algorithms. Proprietary algo suite that trades futures markets 24/7. Clients license the technology and connect it to their brokerage.",
    priceRange: "$10,000 - $20,000",
    avatar: "Active or aspiring traders, 25-50, tired of manual trading. Have trading capital and want systematic, emotion-free execution. Often have blown accounts before.",
  },
  {
    id: "growai",
    name: "GrowAI",
    description: "AI-powered marketing agency. Full-service digital marketing using AI tools for content creation, ad management, and lead generation. White-glove service for local businesses.",
    priceRange: "$3,000 - $10,000/mo",
    avatar: "Local business owners, medical practices, home services, law firms. Want more leads and patients but don't understand digital marketing. Revenue $500K-$5M.",
  },
  {
    id: "caliber",
    name: "Caliber Peptides",
    description: "Telehealth peptide therapy. Direct-to-consumer peptide prescriptions through licensed telehealth providers. Focus on performance optimization, anti-aging, and body composition.",
    priceRange: "$200 - $500/mo subscription",
    avatar: "Health-conscious men 30-55. Into biohacking, fitness, anti-aging. Already spending money on supplements. Want pharmaceutical-grade optimization without doctor visits.",
  },
  {
    id: "directmeds",
    name: "DirectMeds",
    description: "Direct-to-consumer telehealth platform. Prescription medications delivered to your door through licensed providers. Focus on weight loss, hormone therapy, and men's health.",
    priceRange: "$150 - $400/mo subscription",
    avatar: "Adults 25-60 wanting convenient, discreet access to prescription treatments. Weight loss (GLP-1), TRT, hair loss, ED. Value privacy and convenience over traditional doctor visits.",
  },
  {
    id: "poly",
    name: "Poly Profits",
    description: "Automated Polymarket trading bot. Proprietary algorithm that trades prediction markets on Polymarket. Uses data analysis and probability modeling to find edge in event contracts.",
    priceRange: "$5,000 - $15,000",
    avatar: "Crypto-savvy investors 25-45. Already on Polymarket or interested in prediction markets. Want automated edge. Comfortable with alternative investments and emerging platforms.",
  },
] as const;

export const COPY_TYPES = [
  { id: "vsl", name: "VSL Script", description: "Full video sales letter script (15-45 min)", useOpus: true },
  { id: "ads", name: "Ad Copy (5 variations)", description: "5 unique ad variations for paid media" },
  { id: "emails", name: "Email Sequence (7 emails)", description: "7-email nurture/sales sequence" },
  { id: "landing", name: "Landing Page Copy", description: "Full landing page with headline, body, CTA" },
  { id: "objections", name: "Objection Handlers", description: "Common objections with rebuttals" },
  { id: "texts", name: "Follow-up Texts", description: "SMS/text follow-up sequences" },
  { id: "onepager", name: "One-Pager / Sales Sheet", description: "Single-page sales document" },
  { id: "social", name: "Social Media Posts", description: "Platform-specific social content" },
] as const;

export type OfferId = (typeof OFFERS)[number]["id"];
export type CopyTypeId = (typeof COPY_TYPES)[number]["id"];
