import { NextResponse } from "next/server";
import { store, getCheck, addAudit } from "@/lib/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  if (check.status !== "ai_ready" && check.status !== "ai_processing") {
    return NextResponse.json({ error: "Энэ шалгалтыг авах боломжгүй" }, { status: 400 });
  }

  if (check.lawyerId) {
    return NextResponse.json({ error: "Энэ шалгалт аль хэдийн авагдсан байна" }, { status: 409 });
  }

  check.lawyerId = "law_001";
  check.lawyerName = "Б.Батболд";
  check.status = "in_review";
  addAudit("law_001", "lawyer", "check_claimed", "check", id);

  // Re-check SLA - lawyer must finish within remaining time
  if (!check.slaDueAt) {
    const slaHours = check.package === "urgent" ? 1 : 4;
    check.slaDueAt = new Date(Date.now() + slaHours * 3600_000).toISOString();
  }

  return NextResponse.json({
    success: true,
    check: {
      id: check.id,
      status: check.status,
      slaDueAt: check.slaDueAt,
      lawyerName: check.lawyerName,
    },
  });
}