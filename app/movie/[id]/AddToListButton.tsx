"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type ListItemLite = { tmdb_id: number };
type MeResponse = { admin?: boolean };
type ListResponse = { items?: ListItemLite[] };

type Props = {
  tmdb_id: number;
  title: string;
  year?: number | null;
  poster_url?: string | null;
};

export default function AddToListButton({
  tmdb_id,
  title,
  year,
  poster_url,
}: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [already, setAlready] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const me: MeResponse = await fetch("/api/auth/me", {
          cache: "no-store",
        }).then((r) => r.json());
        if (!me?.admin) {
          if (!cancelled) setLoggedIn(false);
          return;
        }
        if (!cancelled) setLoggedIn(true);

        const list: ListResponse = await fetch("/api/list", {
          cache: "no-store",
        }).then((r) => r.json());
        const ids = new Set<number>((list.items ?? []).map((x) => x.tmdb_id));
        if (!cancelled) setAlready(ids.has(tmdb_id));
      } catch {
        if (!cancelled) {
          setLoggedIn(false);
          setAlready(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [tmdb_id]);

  async function add() {
    if (!loggedIn || already) return;
    setAdding(true);
    try {
      const res = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, title, year, poster_url }),
      });
      if (res.ok) {
        setAlready(true);
        toast("Listeye eklendi ✅", "success");
      } else {
        toast("Eklenemedi", "error");
      }
    } catch {
      toast("Eklenemedi", "error");
    } finally {
      setAdding(false);
    }
  }

  if (!loggedIn) return null;

  return (
    <button
      onClick={add}
      disabled={adding || already}
      className="btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60"
      type="button"
    >
      {already ? "Zaten listede" : adding ? "Ekleniyor..." : "Listeye Ekle"}
    </button>
  );
}
