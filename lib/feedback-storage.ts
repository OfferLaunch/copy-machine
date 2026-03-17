import { put, list } from "@vercel/blob";

export interface FeedbackEntry {
  id: string;
  offerId: string;
  copyTypeId?: string;
  feedback: string;
  context?: string;
  createdAt: string;
}

const BLOB_NAME = "feedback.json";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
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

export async function getFeedback(): Promise<FeedbackEntry[]> {
  try {
    const url = await findBlobUrl();
    if (!url) return [];
    const res = await fetch(url, { cache: "no-store" });
    return await res.json();
  } catch {
    return [];
  }
}

async function saveFeedback(entries: FeedbackEntry[]): Promise<void> {
  try {
    const oldUrl = await findBlobUrl();
    if (oldUrl) {
      const { del } = await import("@vercel/blob");
      await del(oldUrl);
    }
  } catch {}
  await put(BLOB_NAME, JSON.stringify(entries, null, 2), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
}

export async function addFeedback(entry: Omit<FeedbackEntry, "id" | "createdAt">): Promise<FeedbackEntry> {
  const entries = await getFeedback();
  const full: FeedbackEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
  entries.push(full);
  await saveFeedback(entries);
  return full;
}

export async function deleteFeedbackById(id: string): Promise<void> {
  const entries = await getFeedback();
  await saveFeedback(entries.filter((e) => e.id !== id));
}

export async function getFeedbackForOffer(offerId: string, limit = 10): Promise<FeedbackEntry[]> {
  const entries = await getFeedback();
  return entries.filter((e) => e.offerId === offerId).slice(-limit);
}
