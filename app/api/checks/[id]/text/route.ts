import { NextResponse } from "next/server";
import { store, getCheck, getText, recalcOverallRisk } from "@/lib/store";
import { maskPII } from "@/lib/mask";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const text = getText(id);

  if (!text) {
    return NextResponse.json({ error: "Текст олдсонгүй" }, { status: 404 });
  }

  return NextResponse.json({
    checkId: id,
    maskedText: text.maskedText,
    masks: text.masks,
    maskCount: text.masks.length,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const text = getText(id);

  if (!text) {
    return NextResponse.json({ error: "Текст олдсонгүй" }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body.maskedText !== "string") {
    return NextResponse.json({ error: "Текст шаардлагатай" }, { status: 400 });
  }

  // Re-mask after citizen edits so PII never leaks back into the reviewed text
  const remasked = maskPII(body.maskedText);
  text.maskedText = remasked.maskedText;
  text.masks = remasked.masks;

  const check = getCheck(id);
  if (check) recalcOverallRisk(id);

  return NextResponse.json({
    success: true,
    maskedText: text.maskedText,
    maskCount: text.masks.length,
  });
}
