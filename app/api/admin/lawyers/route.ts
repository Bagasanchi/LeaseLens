import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const lawyers = store.lawyers.map((l) => ({
    ...l,
    status: l.status,
  }));
  return NextResponse.json(lawyers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const lawyerId = body.lawyerId;
  const action = body.action;

  const lawyer = store.lawyers.find((l) => l.id === lawyerId);
  if (!lawyer) {
    return NextResponse.json({ error: "Хуульч олдсонгүй" }, { status: 404 });
  }

  if (action === "verify") {
    lawyer.verified = true;
  } else if (action === "reject") {
    lawyer.verified = false;
    lawyer.status = "suspended";
  }

  return NextResponse.json(lawyer);
}