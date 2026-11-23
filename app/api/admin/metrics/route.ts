import { NextResponse } from "next/server";
import { store } from "@/lib/store";

function isBusinessHours(date: Date) {
  const day = date.getDay();
  const hour = date.getHours();
  if (day === 0) return false;
  if (day === 6) return hour >= 10 && hour < 18;
  return hour >= 9 && hour < 21;
}

function businessHoursDiff(start: Date, end: Date): number {
  let hours = 0;
  const current = new Date(start);
  while (current < end) {
    if (isBusinessHours(current)) hours++;
    current.setHours(current.getHours() + 1);
  }
  return hours;
}

export async function GET() {
  const now = new Date();
  const checks = store.checks;

  // Queue load
  const waiting = checks.filter(
    (c) => c.status === "ai_processing" || c.status === "ai_ready"
  ).length;
  const inProgress = checks.filter((c) => c.status === "in_review").length;
  const overdue = checks.filter(
    (c) => c.slaDueAt && new Date(c.slaDueAt) < now && c.status !== "delivered"
  ).length;

  // SLA breaches
  const slaBreachesAll = checks.filter(
    (c) => c.slaDueAt && new Date(c.slaDueAt) < now && c.status !== "delivered"
  );
  const totalBreaches = slaBreachesAll.length;
  const last24h = slaBreachesAll.filter(
    (c) => new Date(c.slaDueAt ?? 0) > new Date(now.getTime() - 24 * 3600_000)
  ).length;

  const byLawyer: Record<string, number> = {};
  for (const c of slaBreachesAll) {
    if (c.lawyerId) byLawyer[c.lawyerId] = (byLawyer[c.lawyerId] ?? 0) + 1;
  }

  // Verification
  const verification = {
    pending: store.lawyers.filter((l) => !l.verified && l.status === "active").length,
    verified: store.lawyers.filter((l) => l.verified).length,
    rejected: store.lawyers.filter((l) => l.status === "suspended").length,
  };

  // Library
  const library = {
    laws: new Set(store.laws.map((l) => l.code)).size,
    articles: store.laws.length,
    lastUpdated: store.laws.reduce(
      (latest, l) => (new Date(l.updatedAt) > new Date(latest) ? l.updatedAt : latest),
      new Date(0).toISOString()
    ),
  };

  // Pricing
  const pricing = store.pricing;

  // AI edit rate
  const allFindings = store.findings;
  const totalFindings = allFindings.filter((f) => f.source === "ai").length;
  const editedFindings = allFindings.filter((f) => f.source === "ai" && f.status === "edited").length;
  const aiEditRate = totalFindings > 0 ? (editedFindings / totalFindings) * 100 : 0;

  return NextResponse.json({
    queueLoad: { waiting, inProgress, overdue },
    slaBreaches: { total: totalBreaches, last24h, byLawyer },
    verification,
    library,
    pricing,
    aiEditRate: { total: totalFindings, edited: editedFindings, rate: aiEditRate },
  });
}