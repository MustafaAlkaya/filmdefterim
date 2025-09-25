"use client";
import { useRouter } from "next/navigation";

export default function BackToSearch() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="btn bg-neutral-800 hover:bg-neutral-700"
      type="button"
    >
      ← Aramaya dön
    </button>
  );
}
