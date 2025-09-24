import { NextResponse } from "next/server";
import { checkCredentials } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!checkCredentials(email, password)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz bilgiler" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set("admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd, // prod’da secure, local’de değil
    path: "/",
  });
  return res;
}
