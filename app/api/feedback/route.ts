import { NextRequest } from "next/server";
import { getFeedback, addFeedback, deleteFeedbackById } from "@/lib/feedback-storage";

export async function GET(req: NextRequest) {
  const offerId = req.nextUrl.searchParams.get("offerId");
  const entries = await getFeedback();
  if (offerId) return Response.json(entries.filter((e) => e.offerId === offerId));
  return Response.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { offerId, copyTypeId, feedback, context } = body;
  if (!offerId || !feedback) {
    return Response.json({ error: "offerId and feedback required" }, { status: 400 });
  }
  const entry = await addFeedback({ offerId, copyTypeId, feedback, context });
  return Response.json(entry);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await deleteFeedbackById(id);
  return Response.json({ ok: true });
}
