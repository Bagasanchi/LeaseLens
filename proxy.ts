import { NextRequest, NextResponse } from "next/server";
export function proxy(req: NextRequest) {
  if (process.env.VERCEL && !["GET", "HEAD"].includes(req.method)) {
    return NextResponse.json({error:"Нийтийн демо зөвхөн жишээ өгөгдөл харуулна."},{status:403});
  }
  return NextResponse.next();
}
export const config = { matcher: "/api/:path*" };
