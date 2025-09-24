// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { checkCredentials } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!checkCredentials(email, password)) {
    return NextResponse.json({ error: "Geçersiz giriş" }, { status: 401 });
  }

  // 7 gün (saniye cinsinden)
  const maxAge = 60 * 60 * 24 * 7;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "1", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge,
  });

  return res;
}
