import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const queue = store.checks
    .filter(
      (c) =>
        (c.status === "ai_processing" || c.status === "ai_ready" || c.status === "in_review") &&
        c.slaDueAt
    )
    .map((c) => ({
      id: c.id,
      type: c.type,
      package: c.package,
      slaDueAt: c.slaDueAt,
      createdAt: c.createdAt,
      pages: c.pages,
      lawyerId: c.lawyerId,
    }));

  return NextResponse.json(queue);
}

export async function POST(req: Request) {
  // Reassign overdue check to another lawyer
  const body = await req.json();
  const checkId = body.checkId;

  const check = store.checks.find((c) => c.id === checkId);
  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  check.lawyerId = undefined;
  check.lawyerName = undefined;
  check.status = "ai_ready";
  return NextResponse.json({ success: true });
}