"use client";
import { Suspense, useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Movie } from "@/types/movie";
import { toast } from "@/lib/toast";
import { useRef } from "react"; // varsa tekrar ekleme
import SkeletonCard from "@/app/_components/SkeletonCard";
// ... component içinde:

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

function HomePageInner() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listed, setListed] = useState<Set<number>>(new Set());
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  type Ratings = { imdb: number | null; rt: number | null };
  const [ratings, setRatings] = useState<Record<number, Ratings>>({});
  const [casts, setCasts] = useState<Record<number, string[]>>({});
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 500; // ms

  // Sonuçlar değiştiğinde eksik IMDb/RT ve oyuncu bilgilerini getir
  useEffect(() => {
    if (!results || results.length === 0) return;

    (async () => {
      // çok sayıda istek olmaması için ilk 12 sonuçla sınırladık
      const missing = results
        .filter((m) => ratings[m.id] === undefined || casts[m.id] === undefined)
        .slice(0, 12);

      if (missing.length === 0) return;

      const pairs = await Promise.all(
        missing.map(async (m) => {
          const [r1, r2] = await Promise.all([
            fetch(`/api/ratings?id=${m.id}`, { cache: "no-store" })
              .then((r) => r.json())
              .catch(() => ({ imdb: null, rt: null })),
            fetch(`/api/credits?id=${m.id}`, { cache: "no-store" })
              .then((r) => r.json())
              .catch(() => ({ cast: [] })),
          ]);
          return {
            id: m.id,
            ratings: r1 as Ratings,
            cast: (r2.cast as string[]) ?? [],
          };
        })
      );

      setRatings((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.ratings;
        return next;
      });

      setCasts((prev) => {
        const next = { ...prev };
        for (const p of pairs) next[p.id] = p.cast;
        return next;
      });
    })();
  }, [results, ratings, casts]);

  async function refreshAuthAndList() {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const d = await r.json();
      const isIn = !!d.admin;
      setLoggedIn(isIn);

      if (isIn) {
        const lr = await fetch("/api/list", { cache: "no-store" });
        const ld = await lr.json();
        const ids = new Set<number>(
          (ld.items || []).map((x: { tmdb_id: number }) => x.tmdb_id)
        );
        setListed(ids);
      } else {
        setListed(new Set());
      }
    } catch {
      setLoggedIn(false);
      setListed(new Set());
    }
  }

  useEffect(() => {
    refreshAuthAndList(); // ilk yüklemede

    function onAuthChanged() {
      refreshAuthAndList(); // login/logout olduğunda
    }
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/genres", { cache: "force-cache" });
        const d = await r.json();
        setGenreMap(d.map || {});
      } catch {
        setGenreMap({});
      }
    })();
  }, []);
  async function search(arg?: string | React.MouseEvent<HTMLButtonElement>) {
    // Eğer argüman string ise onu kullan, değilse q state’ini kullan
    const query = typeof arg === "string" ? arg.trim() : q.trim();

    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      setResults(d.results || []);
    } finally {
      setLoading(false);
    }
  }

  // debounce ile zamanlayarak çağıracağız
  function scheduleSearch(value: string) {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      search(value);
    }, DEBOUNCE_DELAY);
  }

  // sayfa kapanırken timer temizle (opsiyonel ama iyi)
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  async function addToList(m: Movie) {
    const poster = m.poster_path
      ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
      : null;
    const res = await fetch("/api/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: m.id,
        title: m.title,
        year: m.release_date ? Number(m.release_date.slice(0, 4)) : undefined,
        poster_url: poster,
      }),
    });
    if (res.ok) {
      setListed((prev) => new Set(prev).add(m.id));
      toast("Listeye eklendi ✅", "success");
    } else {
      toast("Eklenemedi", "error");
    }
  }

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      setQ("");
      setResults([]);
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            scheduleSearch(value); // 👈 yazdıkça 300ms bekleyip search çalışır
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter’a basınca beklemeden hemen ara
              if (typingTimer.current) clearTimeout(typingTimer.current);
              search(); // q state’ini kullanır
            }
          }}
          placeholder="Film ara..."
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 outline-none ring-1 ring-neutral-800 focus:ring-orange-600"
        />
        <button
          onClick={search}
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Aranıyor..." : "Ara"}
        </button>
      </div>

      {!loading && results.length === 0 && !q.trim() && (
        <div className="card p-6 text-neutral-300">
          <h2 className="mb-2 text-lg font-semibold">
            FilmDefterim’e hoş geldin 🎬
          </h2>
          <p className="text-sm text-neutral-400">
            Yukarıdan bir film adı yazıp{" "}
            <span className="text-orange-500 font-medium">Ara</span>’ya tıkla.
            Giriş yaptıysan sonuçlardan beğendiklerini listeye ekleyebilirsin.
          </p>
        </div>
      )}
      {!loading && results.length === 0 && q.trim() && (
        <div className="text-sm text-neutral-400">
          Sonuç bulunamadı. Başka bir kelimeyle dene.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : results.map((m: Movie) => (
              <div
                key={m.id}
                className="card overflow-hidden group transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-neutral-900">
                  {m.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                      alt={m.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-neutral-600 text-sm">
                      Poster yok
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="line-clamp-2 font-semibold">{m.title}</div>
                  <div className="text-sm text-neutral-400">
                    {m.release_date?.slice(0, 4) || "—"}
                  </div>

                  {/* Türler + puanlar */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                    {/* Puan rozetleri */}
                    {/* PUANLAR */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                      <span className="badge whitespace-nowrap flex-none">
                        <span className="ico">⭐</span>
                        {typeof ratings[m.id]?.imdb === "number"
                          ? ratings[m.id]!.imdb!.toFixed(1)
                          : "—"}
                        <span className="opacity-70 ml-1">IMDb</span>
                      </span>
                      <span className="badge whitespace-nowrap flex-none">
                        <span className="ico">🍅</span>
                        {typeof ratings[m.id]?.rt === "number"
                          ? `${ratings[m.id]!.rt!}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  {/* TÜRLER */}
                  <div className="mt-1 text-xs text-neutral-400">
                    <GenresChips
                      genres={(m.genre_ids ?? [])
                        .map((id) => genreMap[id])
                        .filter(Boolean)}
                    />
                  </div>
                  {/* İlk 3 oyuncu */}
                  {(casts[m.id]?.length ?? 0) > 0 && (
                    <div className="mt-1 line-clamp-1 text-xs text-neutral-400">
                      {(casts[m.id] || []).slice(0, 3).join(", ")}
                    </div>
                  )}

                  {loggedIn &&
                    (listed.has(m.id) ? (
                      <button className="mt-2 btn w-full bg-neutral-800 opacity-60 cursor-not-allowed">
                        Zaten listede
                      </button>
                    ) : (
                      <button
                        onClick={() => addToList(m)}
                        className="mt-2 btn-primary w-full"
                      >
                        Listeye Ekle
                      </button>
                    ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <HomePageInner />
    </Suspense>
  );
}

//Deneme github
