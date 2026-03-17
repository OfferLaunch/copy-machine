import { NextRequest } from "next/server";
import { getSwipes, addSwipe, deleteSwipeById, deleteSwipe } from "@/lib/swipes-storage";

export async function GET() {
  const swipes = await getSwipes();
  return Response.json(swipes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Support both legacy and new format
  if (body.type) {
    // New format
    const swipe = await addSwipe({
      type: body.type,
      title: body.title,
      tags: body.tags || [],
      offerId: body.offerId,
      copyTypeId: body.copyTypeId,
      content: body.content,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      savedAt: new Date().toISOString(),
      source: body.source || "manual",
    });
    return Response.json(swipe);
  }

  // Legacy format (from thumbs up)
  const { offerId, copyTypeId, content } = body;
  if (!offerId || !copyTypeId || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const swipe = await addSwipe({
    type: "text",
    tags: ["generated"],
    offerId,
    copyTypeId,
    content,
    savedAt: new Date().toISOString(),
    source: "generated",
  });
  return Response.json(swipe);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const index = searchParams.get("index");
  
  if (id) {
    await deleteSwipeById(id);
    return Response.json({ ok: true });
  }
  
  if (index !== null) {
    const idx = parseInt(index, 10);
    if (isNaN(idx)) return Response.json({ error: "Invalid index" }, { status: 400 });
    await deleteSwipe(idx);
    return Response.json({ ok: true });
  }
  
  return Response.json({ error: "Missing id or index" }, { status: 400 });
}
