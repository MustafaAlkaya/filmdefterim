"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

type T = { id: number; text: string; type: ToastType };

export default function ToastHost() {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    function onToast(e: Event) {
      const { text, type, duration } = (e as CustomEvent).detail as {
        text: string;
        type: ToastType;
        duration: number;
      };
      const id = Date.now() + Math.random();
      setList((prev) => [...prev, { id, text, type }]);
      setTimeout(
        () => setList((prev) => prev.filter((t) => t.id !== id)),
        duration ?? 2000
      );
    }
    window.addEventListener("toast", onToast as EventListener);
    return () => window.removeEventListener("toast", onToast as EventListener);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] space-y-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={
            "pointer-events-auto rounded-xl px-4 py-3 shadow-2xl backdrop-blur " +
            (t.type === "error"
              ? "bg-red-600/90 text-white"
              : t.type === "info"
              ? "bg-neutral-800/90 text-neutral-100 ring-1 ring-neutral-700"
              : "bg-green-600/90 text-white")
          }
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
