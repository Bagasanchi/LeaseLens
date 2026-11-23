import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json();
  const standard = Number(body.standard);
  const urgent = Number(body.urgent);

  if (!Number.isFinite(standard) || !Number.isFinite(urgent) || standard < 0 || urgent < 0) {
    return NextResponse.json({ error: "Зөв үнийг оруулна уу" }, { status: 400 });
  }

  store.pricing.standard = standard;
  store.pricing.urgent = urgent;

  return NextResponse.json(store.pricing);
}