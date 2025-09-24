"use client";

import { useEffect, useState } from "react";
import type { ListItem } from "@/types/list-item";
import type { ChangeEvent } from "react";
import { toast } from "@/lib/toast";

// İlk 2 türü tam göster, kalanı +N; ilk tür asla kaybolmaz
function GenresChips({ genres }: { genres: string[] }) {
  if (!genres || genres.length === 0) return null;
  const shown = genres.slice(0, 2);
  const hidden = genres.slice(2);
  return (
    <div className="min-w-0 flex items-center gap-1">
      {shown.map((g, i) => (
        <span
          key={g}
          title={g}
          className={[
            "rounded-md bg-neutral-900 px-2 py-0.5 ring-1 ring-neutral-800",
            "whitespace-nowrap flex-none",
            i === 1 ? "max-w-[8rem] truncate" : "",
          ].join(" ")}
        >
          {g}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          className="rounded-md bg-neutral-900 px-2 py-0.5 ring-1 ring-neutral-800 cursor-help whitespace-nowrap flex-none"
          title={genres.join(", ")}
        >
          +{hidden.length}
        </span>
      )}
    </div>
  );
}

export default function ListPage() {
  type YearFilter = "all" | "2020s" | "2010s" | "2000s" | "1990s" | "older";
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [removing, setRemoving] = useState<Set<number>>(new Set());
  type Details = {
    genres: string[];
    rating: number | null; // TMDb puanı
    imdb?: number | null; // IMDb
    rt?: number | null; // Rotten Tomatoes (%)
    cast?: string[]; // ilk 3 oyuncu
  };
  const [details, setDetails] = useState<Record<number, Details>>({});
  const [genreFilter, setGenreFilter] = useState<"all" | string>("all");

  useEffect(() => {
    async function refresh() {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const d = await r.json();
        setLoggedIn(!!d.admin);
      } catch {
        setLoggedIn(false);
      }
    }
    refresh();

    function onAuthChanged() {
      refresh();
    }
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, []);

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

  async function removeFromList(id: number) {
    if (!loggedIn) return;
    setRemoving((s) => new Set(s).add(id));
    try {
      const r = await fetch(`/api/list?tmdb_id=${id}`, { method: "DELETE" });
      if (!r.ok) {
        toast("Silinemedi", "error");
        return;
      }
      // Listeyi tazele
      const res = await fetch("/api/list", { cache: "no-store" });
      const data = await res.json();
      setItems((data?.items as ListItem[]) || []);
      toast("Listeden çıkarıldı ✅", "success");
    } catch {
      toast("Silinemedi", "error");
    } finally {
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/list", { cache: "no-store" });
        // JSON güvenliği
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) {
          setItems([]);
        } else {
          const data = await r.json();
          setItems((data?.items as ListItem[]) || []);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const missing = items
      .map((m) => m.tmdb_id)
      .filter((id) => details[id] === undefined);

    if (missing.length === 0) return;

    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            const [info, rat, cre] = await Promise.all([
              fetch(`/api/movie?id=${id}`, { cache: "no-store" })
                .then((r) => r.json())
                .catch(() => ({ genres: [], rating: null })),
              fetch(`/api/ratings?id=${id}`, { cache: "no-store" })
                .then((r) => r.json())
                .catch(() => ({ imdb: null, rt: null })),
              fetch(`/api/credits?id=${id}`, { cache: "no-store" })
                .then((r) => r.json())
                .catch(() => ({ cast: [] })),
            ]);
            return [
              id,
              {
                genres: info.genres ?? [],
                rating: info.rating ?? null,
                imdb: rat.imdb ?? null,
                rt: rat.rt ?? null,
                cast: cre.cast ?? [],
              },
            ] as const;
          })
        );
        setDetails((prev) => {
          const next = { ...prev };
          for (const [id, val] of results) next[id] = val;
          return next;
        });
      } catch {
        /* yoksay */
      }
    })();
  }, [items]);

  function inRange(y?: number | null) {
    const year = y ?? 0;
    switch (yearFilter) {
      case "2020s":
        return year >= 2020;
      case "2010s":
        return year >= 2010 && year < 2020;
      case "2000s":
        return year >= 2000 && year < 2010;
      case "1990s":
        return year >= 1990 && year < 2000;
      case "older":
        return year > 0 && year < 1990;
      default:
        return true;
    }
  }

  function matchesGenre(id: number) {
    if (genreFilter === "all") return true;
    const gs = details[id]?.genres ?? [];
    return gs.includes(genreFilter);
  }

  // 🔸 Sadece filtre uygula; SIRALAMA YAPMA.
  // Backend (/api/list) IMDb'ye göre sıralı döndürüyor; buradaki sırayı bozmayalım.
  const filtered = items.filter(
    (m) =>
      (!query.trim() ||
        (m.title || "").toLowerCase().includes(query.trim().toLowerCase())) &&
      inRange(m.year ?? null) &&
      matchesGenre(m.tmdb_id)
  );

  function clearFilters() {
    setQuery("");
    setYearFilter("all");
    setGenreFilter("all");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-orange-500">
        {"Mustafa'nın Listesi"}
      </h1>

      {(query.trim() || yearFilter !== "all" || genreFilter !== "all") && (
        <div className="mb-2 mt-1 flex flex-wrap items-center gap-2 text-xs">
          {query.trim() && (
            <span className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800">
              <span className="text-neutral-300">Arama:</span>
              <span className="text-neutral-200">{query}</span>
              <button
                onClick={() => setQuery("")}
                className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300 hover:bg-neutral-700"
                title="Aramayı temizle"
              >
                ✕
              </button>
            </span>
          )}

          {yearFilter !== "all" && (
            <span className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800">
              <span className="text-neutral-300">Yıl:</span>
              <span className="text-neutral-200">
                {yearFilter === "2020s"
                  ? "2020'ler"
                  : yearFilter === "2010s"
                  ? "2010'lar"
                  : yearFilter === "2000s"
                  ? "2000'ler"
                  : yearFilter === "1990s"
                  ? "1990'lar"
                  : "Daha eski"}
              </span>
              <button
                onClick={() => setYearFilter("all")}
                className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300 hover:bg-neutral-700"
                title="Yıl filtresini temizle"
              >
                ✕
              </button>
            </span>
          )}

          {genreFilter !== "all" && (
            <span className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-2 py-1 ring-1 ring-neutral-800">
              <span className="text-neutral-300">Tür:</span>
              <span className="text-neutral-200">{genreFilter}</span>
              <button
                onClick={() => setGenreFilter("all")}
                className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300 hover:bg-neutral-700"
                title="Tür filtresini temizle"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Sırala dropdown'u kaldırıldı; backend sırası kullanılacak */}
          {/* Tür seçici */}
          <select
            value={genreFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setGenreFilter(e.target.value)
            }
            className="rounded-md bg-neutral-900 px-3 py-2 ring-1 ring-neutral-800 focus:outline-none"
          >
            <option value="all">{"Tüm türler"}</option>
            {Array.from(
              new Set(items.flatMap((m) => details[m.tmdb_id]?.genres ?? []))
            )
              .sort((a, b) => a.localeCompare(b, "tr", { sensitivity: "base" }))
              .map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
          </select>
          <button
            onClick={clearFilters}
            className="rounded-md bg-neutral-900 px-3 py-2 ring-1 ring-neutral-800 hover:bg-neutral-800"
          >
            Filtreyi temizle
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Başlığa göre ara..."
            className="w-56 rounded-md bg-neutral-900 px-3 py-2 ring-1 ring-neutral-800 focus:outline-none"
          />
          <select
            value={yearFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setYearFilter(e.target.value as YearFilter)
            }
            className="rounded-md bg-neutral-900 px-3 py-2 ring-1 ring-neutral-800 focus:outline-none"
          >
            <option value="all">{"Tüm yıllar"}</option>
            <option value="2020s">{"2020'ler"}</option>
            <option value="2010s">{"2010'lar"}</option>
            <option value="2000s">{"2000'ler"}</option>
            <option value="1990s">{"1990'lar"}</option>
            <option value="older">{"Daha eski"}</option>
          </select>
        </div>
      </div>

      {loading && <div>Yükleniyor...</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((m) => (
          <div
            key={m.tmdb_id}
            className="card overflow-hidden group transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30"
          >
            {m.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.poster_url}
                alt={m.title}
                className="w-full transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="h-52 bg-neutral-800" />
            )}
            <div className="p-3">
              <div className="line-clamp-2 font-semibold">{m.title}</div>
              <div className="text-sm text-neutral-400">{m.year ?? "—"}</div>
              {/* PUANLAR */}
              <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                <span className="badge whitespace-nowrap flex-none">
                  <span className="ico">⭐</span>
                  {typeof details[m.tmdb_id]?.imdb === "number"
                    ? details[m.tmdb_id]!.imdb!.toFixed(1)
                    : "—"}
                  <span className="opacity-70 ml-1">IMDb</span>
                </span>
                <span className="badge whitespace-nowrap flex-none">
                  <span className="ico">🍅</span>
                  {typeof details[m.tmdb_id]?.rt === "number"
                    ? `${details[m.tmdb_id]!.rt!}%`
                    : "—"}
                </span>
              </div>
              {/* TÜRLER */}
              <div className="mt-1 text-xs text-neutral-400">
                <GenresChips genres={details[m.tmdb_id]?.genres ?? []} />
              </div>
              {/* İlk 3 oyuncu */}
              {(details[m.tmdb_id]?.cast?.length ?? 0) > 0 && (
                <div className="mt-1 line-clamp-1 text-xs text-neutral-400">
                  {(details[m.tmdb_id]?.cast || []).slice(0, 3).join(", ")}
                </div>
              )}

              {loggedIn && (
                <button
                  onClick={() => removeFromList(m.tmdb_id)}
                  disabled={removing.has(m.tmdb_id)}
                  className="mt-2 btn w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60"
                >
                  {removing.has(m.tmdb_id) ? "Siliniyor..." : "Listeden Çıkar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="text-sm text-neutral-400">Henüz listede film yok.</div>
      )}
    </div>
  );
}
