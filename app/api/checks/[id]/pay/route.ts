import { NextResponse } from "next/server";
import { store, getCheck, nextId, addAudit } from "@/lib/store";
import { PackageType } from "@/lib/store";

const INVOICE_TTL_MS = 15 * 60 * 1000;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const pkg: PackageType = body.package === "urgent" ? "urgent" : "standard";
  const amount = pkg === "urgent" ? store.pricing.urgent : store.pricing.standard;

  // Cancel any prior pending invoice for this check
  for (const p of store.payments) {
    if (p.checkId === id && p.status === "pending") {
      p.status = "failed";
    }
  }

  const now = Date.now();
  const invoiceId = `INV-${id.slice(-6).toUpperCase()}-${now.toString(36).toUpperCase()}`;

  const payment = {
    id: nextId("pay"),
    checkId: id,
    userId: check.userId,
    amount,
    status: "pending" as const,
    invoiceId,
    qrCode: `/api/qpay/qr/${invoiceId}`,
    package: pkg,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVOICE_TTL_MS).toISOString(),
  };

  store.payments.push(payment);
  check.package = pkg;
  check.amount = amount;
  check.status = "awaiting_payment";
  addAudit(check.userId, "citizen", "invoice_created", "payment", payment.id);

  return NextResponse.json({
    invoiceId: payment.invoiceId,
    qrCode: payment.qrCode,
    amount: payment.amount,
    package: pkg,
    expiresAt: payment.expiresAt,
  });
}
