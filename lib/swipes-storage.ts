import { put, list } from "@vercel/blob";

export interface Swipe {
  id: string;
  type: "text" | "image" | "link";
  title?: string;
  tags: string[];
  offerId?: string;
  copyTypeId?: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  savedAt: string;
  source: "generated" | "manual";
}

// Legacy format for migration
interface LegacySwipe {
  offerId: string;
  copyTypeId: string;
  content: string;
  savedAt: string;
}

const BLOB_NAME = "swipes.json";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function migrateSwipe(s: any): Swipe {
  if (s.id && s.type && s.source) return s as Swipe;
  // Legacy migration
  return {
    id: generateId(),
    type: "text",
    tags: ["generated"],
    offerId: s.offerId,
    copyTypeId: s.copyTypeId,
    content: s.content,
    savedAt: s.savedAt,
    source: "generated",
  };
}

async function findBlobUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    if (blobs.length > 0) return blobs[0].url;
    return null;
  } catch {
    return null;
  }
}

export async function getSwipes(): Promise<Swipe[]> {
  try {
    const url = await findBlobUrl();
    if (!url) return [];
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return (data as any[]).map(migrateSwipe);
  } catch {
    return [];
  }
}

export async function saveSwipes(swipes: Swipe[]): Promise<void> {
  try {
    const oldUrl = await findBlobUrl();
    if (oldUrl) {
      const { del } = await import("@vercel/blob");
      await del(oldUrl);
    }
  } catch {}
  await put(BLOB_NAME, JSON.stringify(swipes, null, 2), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
}

export async function addSwipe(swipe: Omit<Swipe, "id">): Promise<Swipe> {
  const swipes = await getSwipes();
  const full: Swipe = { ...swipe, id: generateId() };
  swipes.push(full);
  await saveSwipes(swipes);
  return full;
}

export async function deleteSwipeById(id: string): Promise<void> {
  const swipes = await getSwipes();
  await saveSwipes(swipes.filter((s) => s.id !== id));
}

// Legacy index-based delete (kept for compat)
export async function deleteSwipe(index: number): Promise<void> {
  const swipes = await getSwipes();
  if (index >= 0 && index < swipes.length) {
    swipes.splice(index, 1);
    await saveSwipes(swipes);
  }
}

export async function getSwipesForOffer(offerId: string, copyTypeId: string): Promise<Swipe[]> {
  const swipes = await getSwipes();
  return swipes
    .filter((s) => (s.offerId === offerId || !s.offerId || s.offerId === "general") && (!s.copyTypeId || s.copyTypeId === copyTypeId || s.copyTypeId === "any"))
    .slice(-5);
}
