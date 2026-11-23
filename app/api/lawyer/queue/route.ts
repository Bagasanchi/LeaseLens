import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  // Queue = checks ready for review (ai_processing or ai_ready) that are unclaimed or active
  const queue = store.checks
    .filter((c) => (c.status === "ai_processing" || c.status === "ai_ready") && !c.lawyerId)
    .sort((a, b) => {
      // Urgent package first, then oldest SLA
      if (a.package !== b.package) return a.package === "urgent" ? -1 : 1;
      return new Date(a.slaDueAt ?? a.createdAt).getTime() - new Date(b.slaDueAt ?? b.createdAt).getTime();
    })
    .map((c) => ({
      id: c.id,
      type: c.type,
      package: c.package,
      slaDueAt: c.slaDueAt ?? new Date().toISOString(),
      createdAt: c.createdAt,
      pages: c.pages,
    }));

  const activeCount = store.checks.filter(
    (c) => c.lawyerId === "law_001" && (c.status === "in_review" || c.status === "ai_ready")
  ).length;

  const earningsToday = store.checks
    .filter(
      (c) =>
        c.lawyerId === "law_001" &&
        c.status === "delivered" &&
        c.deliveredAt &&
        new Date(c.deliveredAt).toDateString() === new Date().toDateString()
    )
    .reduce((sum, c) => sum + Math.round(c.amount * 0.7), 0); // 70% revenue share for lawyer

  return NextResponse.json({
    queue,
    activeCount,
    earningsToday,
  });
}
