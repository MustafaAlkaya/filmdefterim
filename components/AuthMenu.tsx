"use client";

import { useEffect, useState } from "react";

export default function AuthMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // İlk yüklemede admin misin öğren
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const d = await r.json();
        setLoggedIn(!!d.admin);
      } catch {
        setLoggedIn(false);
      }
    })();
  }, []);

  async function login() {
    if (!email || !pass) {
      setMsg("E-posta ve şifre gerekli.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    setBusy(false);
    if (!r.ok) {
      setMsg("Giriş hatalı.");
      return;
    }
    setLoggedIn(true);
    window.dispatchEvent(new Event("auth-changed")); // <-- EKLENDİ
    setMsg("Giriş başarılı.");
    setTimeout(() => setOpen(false), 700);
  }

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setBusy(false);
    setLoggedIn(false);
    window.dispatchEvent(new Event("auth-changed")); // <-- EKLENDİ
    setMsg("Çıkış yapıldı.");
    setTimeout(() => setOpen(false), 500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn text-sm bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-lg"
      >
        {loggedIn ? "Admin" : "Giriş"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-neutral-950 ring-1 ring-neutral-800 shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">
              {loggedIn ? "Admin" : "Admin Girişi"}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-neutral-200"
            >
              ✕
            </button>
          </div>

          {msg && <div className="mb-2 text-sm text-neutral-300">{msg}</div>}

          {!loggedIn ? (
            <div className="space-y-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-orange-600"
              />
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type="password"
                placeholder="Şifre"
                className="w-full rounded-xl bg-neutral-900 px-3 py-2 outline-none ring-1 ring-neutral-800 focus:ring-orange-600"
              />
              <button
                onClick={login}
                disabled={busy}
                className="btn-primary w-full disabled:opacity-60"
              >
                {busy ? "Giriş yapılıyor..." : "Giriş yap"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-neutral-400">
                Giriş yaptın. Liste ekleme/silme aktif.
              </div>
              <button
                onClick={logout}
                disabled={busy}
                className="btn w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
              >
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
