// app/admin/page.tsx
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const ok = await isAdmin();
  if (!ok) {
    redirect("/"); // admin değilse ana sayfaya
  }

  // Buraya mevcut admin UI’nı koy (önceden ne render ediyorsan onu)
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      {/* ...mevcut admin içeriğin... */}
    </main>
  );
}
