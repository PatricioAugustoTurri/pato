import { NextResponse } from "next/server";
import { getOfferPhotos } from "@/lib/photos";

export async function GET(request: Request) {
  const limitParam = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 24 ? limitParam : 3;

  return NextResponse.json(await getOfferPhotos(limit));
}
