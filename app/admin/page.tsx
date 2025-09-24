import { redirect } from "next/navigation";

export default function AdminRedirect() {
  // Ana sayfaya giderken aramayı da sıfırlayalım:
  redirect("/?reset=1");
}
