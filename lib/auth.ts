// lib/auth.ts
import { cookies } from "next/headers";

export async function isAdmin() {
  const cookieStore = await cookies(); // cookies() -> Promise
  const c = cookieStore.get("admin");
  return c?.value === "1";
}

export function checkCredentials(email: string, password: string) {
  return (
    email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD
  );
}
