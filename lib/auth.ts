// lib/auth.ts
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

/**
 * Kullanıcı admin mi? (cookie kontrolü)
 */
export async function isAdmin() {
  const cookieStore = await cookies();
  const c = cookieStore.get("admin");
  return c?.value === "1";
}

/**
 * Giriş bilgilerini doğrula.
 * - Email kontrolü (env ile aynı mı)
 * - Şifreyi bcrypt hash ile karşılaştırma
 */
export function checkCredentials(email: string, password: string): boolean {
  // Email doğru mu?
  if (email !== process.env.ADMIN_EMAIL) return false;

  // Hash var mı?
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;

  // Hash karşılaştırması
  return bcrypt.compareSync(password, hash);
}
