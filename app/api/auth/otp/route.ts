import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Утасны дугаар шаардлагатай" }, { status: 400 });
    }
    // Mock sending OTP in demo mode
    return NextResponse.json({ success: true, message: "ОТП код амжилттай илгээгдлээ" });
  } catch {
    return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}