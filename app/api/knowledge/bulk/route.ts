import { NextRequest } from "next/server";
import { addKnowledgeBulk } from "@/lib/knowledge-storage";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { docs } = body as { docs: Array<{ title: string; content: string; scope?: string; category?: string }> };
  if (!docs || !Array.isArray(docs) || docs.length === 0) {
    return Response.json({ error: "docs array required" }, { status: 400 });
  }
  for (const d of docs) {
    if (!d.title || !d.content) {
      return Response.json({ error: "Each doc needs title and content" }, { status: 400 });
    }
  }
  const created = await addKnowledgeBulk(
    docs.map((d) => ({ title: d.title, content: d.content, scope: d.scope || "global", category: d.category }))
  );
  return Response.json({ created: created.length, docs: created });
}
