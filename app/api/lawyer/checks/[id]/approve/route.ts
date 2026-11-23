import { NextResponse } from "next/server";
import { store, getCheck, getFindings, recalcOverallRisk, addAudit } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const body = await req.json();
  const { generalNote, overallRisk } = body;

  // Verify all findings are reviewed (not pending)
  const findings = getFindings(id);
  const pending = findings.filter((f) => f.status === "pending");
  if (pending.length > 0) {
    return NextResponse.json(
      { error: "Бүх дүгнэлтийг хянах хүртэл баталж илгээх боломжгүй" },
      { status: 400 }
    );
  }

  check.status = "delivered";
  check.deliveredAt = new Date().toISOString();
  check.lawyerNote = generalNote ?? "";
  check.overallRisk = overallRisk ?? check.overallRisk;

  // Recalculate final risk
  recalcOverallRisk(id);

  addAudit("law_001", "lawyer", "check_approved", "check", id);

  // In production: trigger PDF generation, SMS/email to citizen, payment to lawyer
  return NextResponse.json({ success: true, status: "delivered", deliveredAt: check.deliveredAt });
}