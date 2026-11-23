import { NextResponse } from "next/server";
import { store, addAudit } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    id: "usr_demo",
    phone: "+976 8812 3456",
    createdAt: store.checks[store.checks.length - 1]?.createdAt ?? new Date().toISOString(),
    checkCount: store.checks.filter((c) => c.userId === "usr_demo").length,
  });
}

export async function DELETE() {
  const userId = "usr_demo";

  const checkIds = store.checks.filter((c) => c.userId === userId).map((c) => c.id);

  store.checks = store.checks.filter((c) => c.userId !== userId);
  store.findings = store.findings.filter((f) => !checkIds.includes(f.checkId));
  store.texts = store.texts.filter((t) => !checkIds.includes(t.checkId));
  store.consents = store.consents.filter((c) => !checkIds.includes(c.checkId));
  store.payments = store.payments.filter((p) => p.userId !== userId);
  store.questions = store.questions.filter((q) => !checkIds.includes(q.checkId));

  addAudit(userId, "citizen", "account_deleted", "user", userId);

  return NextResponse.json({ success: true });
}
