// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "", {
    httpOnly: true,
    secure: isProd, // prod'da secure, localde değil
    sameSite: "strict",
    path: "/",
    maxAge: 0, // hemen sil
  });

  return res;
}
