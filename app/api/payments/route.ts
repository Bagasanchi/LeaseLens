import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const payments = store.payments
    .filter((p) => p.userId === "usr_demo")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      package: p.package,
      invoiceId: p.invoiceId,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      checkId: p.checkId,
    }));

  return NextResponse.json(payments);
}
