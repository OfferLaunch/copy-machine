import { NextRequest } from "next/server";
import { getKnowledge, addKnowledge, deleteKnowledgeById } from "@/lib/knowledge-storage";

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  const docs = await getKnowledge();
  if (scope) return Response.json(docs.filter((d) => d.scope === scope));
  return Response.json(docs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, scope, category } = body;
  if (!title || !content) {
    return Response.json({ error: "title and content required" }, { status: 400 });
  }
  const doc = await addKnowledge({ title, content, scope: scope || "global", category });
  return Response.json(doc);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await deleteKnowledgeById(id);
  return Response.json({ ok: true });
}
