import { NextResponse } from "next/server";
import { store, nextId, addAudit, ContractType, PackageType } from "@/lib/store";

export async function GET() {
  const checks = store.checks
    .filter((c) => c.userId === "usr_demo")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      package: c.package,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
      deliveredAt: c.deliveredAt,
      lawyerName: c.lawyerName,
      overallRisk: c.overallRisk,
      pages: c.pages,
      amount: c.amount,
    }));

  return NextResponse.json(checks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type: ContractType = body.type === "labor" ? "labor" : "rental";
    const pkg: PackageType = body.package === "urgent" ? "urgent" : "standard";

    const check = {
      id: nextId("chk"),
      userId: "usr_demo",
      type,
      package: pkg,
      status: "awaiting_payment" as const,
      createdAt: new Date().toISOString(),
      overallRisk: "low" as const,
      pages: body.pages ?? 0,
      amount: pkg === "urgent" ? store.pricing.urgent : store.pricing.standard,
    };

    store.checks.push(check);
    addAudit("usr_demo", "citizen", "check_created", "check", check.id);

    return NextResponse.json(check, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Шалгалт үүсгэхэд алдаа гарлаа" }, { status: 500 });
  }
}
