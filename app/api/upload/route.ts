import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const blob = await put(`swipe-images/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    return Response.json({ url: blob.url });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
