// lib/auth.ts
import { cookies } from "next/headers";

export async function isAdmin() {
  const cookieStore = await cookies();
  const c = cookieStore.get("admin");
  return c?.value === "1"; // sadece "1" olduğunda admin kabul et
}

export function checkCredentials(email: string, password: string) {
  return (
    email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD
  );
}
