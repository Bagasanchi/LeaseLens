import { NextResponse } from "next/server";
import { store, getCheck, addAudit } from "@/lib/store";

/**
 * QPay callback / status check.
 * Real integration: QPay calls this endpoint with the invoice_id after payment.
 * In demo mode, a GET with `invoice_id` returns the current payment state.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoice_id");

  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id шаардлагатай" }, { status: 400 });
  }

  const payment = store.payments.find((p) => p.invoiceId === invoiceId);
  if (!payment) {
    return NextResponse.json({ error: "Нэхэмжлэл олдсонгүй" }, { status: 404 });
  }

  const expired = new Date(payment.expiresAt).getTime() < Date.now();
  if (payment.status === "pending" && expired) {
    payment.status = "failed";
  }

  const check = getCheck(payment.checkId);
  if (payment.status === "paid" && check && !check.paidAt) {
    markPaid(check, payment);
  }

  return NextResponse.json({
    invoiceId: payment.invoiceId,
    paid: payment.status === "paid",
    status: payment.status,
    amount: payment.amount,
    checkId: payment.checkId,
    expiresAt: payment.expiresAt,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const invoiceId = body.invoice_id ?? body.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id шаардлагатай" }, { status: 400 });
  }

  const payment = store.payments.find((p) => p.invoiceId === invoiceId);
  if (!payment) {
    return NextResponse.json({ error: "Нэхэмжлэл олдсонгүй" }, { status: 404 });
  }

  if (new Date(payment.expiresAt).getTime() < Date.now()) {
    payment.status = "failed";
    return NextResponse.json({ paid: false, status: "expired" });
  }

  const check = getCheck(payment.checkId);
  if (check) markPaid(check, payment);

  return NextResponse.json({ paid: true, status: "paid", checkId: payment.checkId });
}

function markPaid(check: NonNullable<ReturnType<typeof getCheck>>, payment: (typeof store.payments)[number]) {
  const now = new Date();
  check.paidAt = now.toISOString();
  check.status = "ai_processing";

  // SLA clock starts when payment lands
  const slaHours = check.package === "urgent" ? 1 : 4;
  check.slaDueAt = new Date(now.getTime() + slaHours * 3600_000).toISOString();

  payment.status = "paid";
  payment.paidAt = now.toISOString();

  addAudit(check.userId, "citizen", "payment_paid", "payment", payment.id);
  addAudit("system", "system", "ai_job_queued", "check", check.id);
}
