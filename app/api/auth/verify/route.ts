import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Дугаар ба код шаардлагатай" }, { status: 400 });
    }
    // Mock OTP verification (accept any 6-digit code or "123456")
    if (code === "123456" || code.length === 6) {
      return NextResponse.json({
        success: true,
        user: { id: "usr_demo", phone, role: "citizen" },
        token: "demo_jwt_token",
      });
    }
    return NextResponse.json({ error: "Буруу код" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}