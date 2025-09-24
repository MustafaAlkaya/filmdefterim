// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { checkCredentials } from "@/lib/auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gerekli" },
      { status: 400 }
    );
  }

  if (!checkCredentials(email, password)) {
    return NextResponse.json({ error: "Geçersiz giriş" }, { status: 401 });
  }

  // 7 gün (saniye)
  const maxAge = 60 * 60 * 24 * 7;
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "1", {
    httpOnly: true,
    secure: isProd, // prod: true, local: false (localhost'ta cookie düşsün)
    sameSite: "strict",
    path: "/",
    maxAge,
  });

  return res;
}
