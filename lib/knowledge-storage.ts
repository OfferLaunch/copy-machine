import { put, list } from "@vercel/blob";

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  scope: "global" | string;
  category?: string;
  createdAt: string;
}

const BLOB_PREFIX = "knowledge";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function findBlobUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      // Return the largest (most complete) blob if multiple exist
      const sorted = blobs.sort((a, b) => b.size - a.size);
      return sorted[0].url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getKnowledge(): Promise<KnowledgeDoc[]> {
  const url = await findBlobUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  return await res.json();
}

async function saveKnowledge(docs: KnowledgeDoc[]): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      const { del } = await import("@vercel/blob");
      await del(blobs.map(b => b.url));
    }
  } catch {}
  await put(BLOB_PREFIX + ".json", JSON.stringify(docs, null, 2), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
}

export async function addKnowledge(doc: Omit<KnowledgeDoc, "id" | "createdAt">): Promise<KnowledgeDoc> {
  const docs = await getKnowledge();
  const full: KnowledgeDoc = { ...doc, id: generateId(), createdAt: new Date().toISOString() };
  docs.push(full);
  await saveKnowledge(docs);
  return full;
}

export async function addKnowledgeBulk(items: Omit<KnowledgeDoc, "id" | "createdAt">[]): Promise<KnowledgeDoc[]> {
  const docs = await getKnowledge();
  const newDocs: KnowledgeDoc[] = items.map((item) => ({
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));
  docs.push(...newDocs);
  await saveKnowledge(docs);
  return newDocs;
}

export async function deleteKnowledgeById(id: string): Promise<void> {
  const docs = await getKnowledge();
  await saveKnowledge(docs.filter((d) => d.id !== id));
}

export async function getKnowledgeForGeneration(offerId: string, copyTypeId?: string, maxChars = 10000): Promise<KnowledgeDoc[]> {
  const docs = await getKnowledge();
  const relevant = docs.filter((d) => d.scope === "global" || d.scope === offerId);
  
  // Sort: category-matching first, then most recent
  const sorted = relevant.sort((a, b) => {
    if (copyTypeId) {
      const aMatch = a.category && categoryMatchesCopyType(a.category, copyTypeId) ? 1 : 0;
      const bMatch = b.category && categoryMatchesCopyType(b.category, copyTypeId) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Take up to 5, capped at maxChars total
  const selected: KnowledgeDoc[] = [];
  let totalChars = 0;
  for (const doc of sorted) {
    if (selected.length >= 5) break;
    const docChars = doc.title.length + doc.content.length + 20;
    if (totalChars + docChars > maxChars) continue;
    selected.push(doc);
    totalChars += docChars;
  }
  return selected;
}

function categoryMatchesCopyType(category: string, copyTypeId: string): boolean {
  const map: Record<string, string[]> = {
    ads: ["ads", "advertising", "marketing", "sales"],
    emails: ["email", "emails", "marketing", "sales"],
    vsl: ["sales", "vsl", "video", "marketing"],
    landing: ["sales", "landing", "marketing", "web"],
    objections: ["sales", "objections", "psychology"],
    texts: ["sales", "texts", "sms", "marketing"],
    social: ["social", "marketing", "ads"],
    onepager: ["sales", "marketing"],
  };
  const matches = map[copyTypeId] || [];
  return matches.some((m) => category.toLowerCase().includes(m));
}
