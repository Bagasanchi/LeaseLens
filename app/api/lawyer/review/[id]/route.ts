import { NextResponse } from "next/server";
import { store, getCheck, getFindings, getText, recalcOverallRisk } from "@/lib/store";

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
  const text = getText(id);
  const risk = recalcOverallRisk(id);

  return NextResponse.json({
    id: check.id,
    type: check.type,
    maskedText: text?.maskedText ?? "",
    findings: findings.map((f) => ({
      id: f.id,
      clauseQuote: f.clauseQuote,
      risk: f.risk,
      explanation: f.explanation,
      lawArticleId: f.lawArticleId,
      suggestion: f.suggestion,
      source: f.source,
      status: f.status,
      lawyerNote: f.lawyerNote,
    })),
    overallRisk: risk,
    slaDueAt: check.slaDueAt,
  });
}