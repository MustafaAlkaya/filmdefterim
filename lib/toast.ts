// lib/toast.ts
export type ToastType = "success" | "error" | "info";

export function toast(
  text: string,
  type: ToastType = "success",
  duration = 2000
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("toast", { detail: { text, type, duration } })
  );
}
