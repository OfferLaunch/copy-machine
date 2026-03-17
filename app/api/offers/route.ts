import { NextRequest } from "next/server";
import { getOffers, upsertOffer, deleteOffer } from "@/lib/offers-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const offers = await getOffers();
  return Response.json(offers);
}

export async function POST(req: NextRequest) {
  const offer = await req.json();
  if (!offer.id || !offer.name) {
    return Response.json({ error: "id and name required" }, { status: 400 });
  }
  await upsertOffer(offer);
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await deleteOffer(id);
  return Response.json({ ok: true });
}
