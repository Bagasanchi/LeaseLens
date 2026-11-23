import { NextResponse } from "next/server";
import { store, getCheck, getFindings, getText, getLawyer, getQuestions, recalcOverallRisk, addAudit } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const findings = getFindings(id);
  const lawyer = check.lawyerId ? getLawyer(check.lawyerId) : undefined;

  return NextResponse.json({
    id: check.id,
    type: check.type,
    package: check.package,
    status: check.status,
    createdAt: check.createdAt,
    paidAt: check.paidAt,
    deliveredAt: check.deliveredAt,
    slaDueAt: check.slaDueAt,
    overallRisk: check.overallRisk,
    pages: check.pages,
    amount: check.amount,
    lawyerName: check.lawyerName,
    lawyerLicense: lawyer?.licenseNumber,
    lawyerNote: check.lawyerNote,
    findingsCount: findings.filter((f) => f.status !== "rejected").length,
    highRiskCount: findings.filter((f) => f.risk === "high" && f.status !== "rejected").length,
    questions: getQuestions(id),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = store.checks.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  store.checks.splice(index, 1);
  store.findings = store.findings.filter((f) => f.checkId !== id);
  store.texts = store.texts.filter((t) => t.checkId !== id);
  store.consents = store.consents.filter((c) => c.checkId !== id);
  store.payments = store.payments.filter((p) => p.checkId !== id);
  store.questions = store.questions.filter((q) => q.checkId !== id);
  addAudit("usr_demo", "citizen", "check_deleted", "check", id);

  return NextResponse.json({ success: true });
}
