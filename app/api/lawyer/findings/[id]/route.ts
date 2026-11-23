import { NextResponse } from "next/server";
import { store, getCheck, recalcOverallRisk, addAudit } from "@/lib/store";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const finding = store.findings.find((f) => f.id === id);
  if (!finding) {
    return NextResponse.json({ error: "Дүгнэлт олдсонгүй" }, { status: 404 });
  }

  const action = body.action as "approve" | "edit" | "reject" | undefined;
  if (!action) {
    return NextResponse.json({ error: "Үйлдэл шаардлагатай (approve|edit|reject)" }, { status: 400 });
  }

  switch (action) {
    case "approve":
      finding.status = "approved";
      break;
    case "edit":
      finding.status = "edited";
      finding.lawyerNote = body.lawyerNote ?? body.explanation ?? "";
      if (body.explanation) finding.explanation = body.explanation;
      if (body.suggestion) finding.suggestion = body.suggestion;
      if (body.risk) finding.risk = body.risk;
      break;
    case "reject":
      finding.status = "rejected";
      finding.lawyerNote = body.lawyerNote ?? "";
      break;
  }

  const check = getCheck(finding.checkId);
  if (check) recalcOverallRisk(check.id);

  addAudit("law_001", "lawyer", `finding_${action}`, "finding", id);

  return NextResponse.json(finding);
}