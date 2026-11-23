import { NextResponse } from "next/server";
import { store, getCheck, nextId, addAudit } from "@/lib/store";

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
  const { clauseQuote, risk, explanation, lawArticleId, suggestion } = body;

  if (!clauseQuote?.trim() || !explanation?.trim()) {
    return NextResponse.json({ error: "Заалт ба тайлбар шаардлагатай" }, { status: 400 });
  }

  const finding = {
    id: nextId("fnd"),
    checkId: id,
    clauseQuote: clauseQuote.trim(),
    risk: risk ?? "mid",
    explanation: explanation.trim(),
    lawArticleId: lawArticleId ?? "",
    suggestion: suggestion ?? "",
    source: "lawyer" as const,
    status: "pending" as const,
    lawyerNote: undefined,
    createdAt: new Date().toISOString(),
  };

  store.findings.push(finding);
  addAudit("law_001", "lawyer", "finding_added", "finding", finding.id);

  return NextResponse.json(finding, { status: 201 });
}