// app/movie/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

type MovieInfo = {
  id: number;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  genres?: string[];
  rating?: number | null; // TMDb ort.
};

type Ratings = { imdb: number | null; rt: number | null };

// ---- helpers ----
async function getBaseUrlFromHeaders() {
  const h = await headers(); // senkron
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function getJSON<T>(url: string, revalidate: number) {
  const r = await fetch(url, { next: { revalidate } });
  if (!r.ok) throw new Error("Fetch failed");
  return (await r.json()) as T;
}

async function fetchMovie(base: string, id: string) {
  const [info, ratings, credits] = await Promise.all([
    getJSON<MovieInfo>(`${base}/api/movie?id=${id}`, 86400), // 1 gün
    getJSON<Ratings>(`${base}/api/ratings?id=${id}`, 21600), // 6 saat
    getJSON<{ cast: string[] }>(`${base}/api/credits?id=${id}`, 21600),
  ]);

  return {
    info,
    ratings,
    cast: credits.cast?.slice(0, 10) ?? [],
  };
}

// ---- metadata ----
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const base = await getBaseUrlFromHeaders();
    const info = await getJSON<MovieInfo>(
      `${base}/api/movie?id=${params.id}`,
      86400
    );

    const title = info.title || "Film";
    const year = info.release_date?.slice(0, 4) || "";
    const fullTitle = year
      ? `${title} (${year}) — FilmDefterim`
      : `${title} — FilmDefterim`;
    const poster = info.poster_path
      ? `https://image.tmdb.org/t/p/w500${info.poster_path}`
      : undefined;

    return {
      title: fullTitle,
      description: info.overview ?? undefined,
      openGraph: {
        title: fullTitle,
        description: info.overview ?? undefined,
        images: poster ? [{ url: poster }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description: info.overview ?? undefined,
        images: poster ? [poster] : [],
      },
    };
  } catch {
    return { title: "Film — FilmDefterim" };
  }
}

// ---- page ----
export default async function MovieDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const base = await getBaseUrlFromHeaders();
  const { info, ratings, cast } = await fetchMovie(base, params.id);

  const year = info.release_date?.slice(0, 4) ?? "—";
  const genres = info.genres ?? [];
  const poster = info.poster_path
    ? `https://image.tmdb.org/t/p/w500${info.poster_path}`
    : null;
  const backdrop = info.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${info.backdrop_path}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-[280px] overflow-hidden rounded-2xl bg-neutral-900">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={info.title}
              className="w-full object-cover"
            />
          ) : (
            <div className="h-[420px] grid place-items-center text-neutral-600">
              Poster yok
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-extrabold">{info.title}</h1>
          <div className="text-neutral-400">{year}</div>

          {/* Puanlar */}
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <span className="badge">
              <span className="ico">⭐</span>
              {typeof ratings.imdb === "number"
                ? ratings.imdb.toFixed(1)
                : "puan yok"}
              <span className="opacity-70 ml-1">IMDb</span>
            </span>
            <span className="badge">
              <span className="ico">🍅</span>
              {typeof ratings.rt === "number" ? `${ratings.rt}%` : "puan yok"}
            </span>
            <span className="badge">
              TMDb{" "}
              {typeof info.rating === "number" ? info.rating.toFixed(1) : "—"}
            </span>
          </div>

          {/* Türler */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-neutral-900 px-2 py-0.5 ring-1 ring-neutral-800"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Özet */}
          {info.overview && (
            <p className="text-sm leading-6 text-neutral-300">
              {info.overview}
            </p>
          )}

          {/* Oyuncular */}
          {cast.length > 0 && (
            <div className="text-sm text-neutral-300">
              <span className="text-neutral-400">Oyuncular: </span>
              {cast.join(", ")}
            </div>
          )}

          {/* Geri / Keşfet linkleri */}
          <div className="pt-2 flex gap-3">
            <Link href="/" className="btn bg-neutral-800 hover:bg-neutral-700">
              ← Aramaya dön
            </Link>
            <Link
              href="/discover"
              className="btn bg-neutral-800 hover:bg-neutral-700"
            >
              Keşfet&apos;e git
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop (varsa) */}
      {backdrop && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backdrop}
            alt={`${info.title} arka plan`}
            className="w-full object-cover opacity-80"
          />
        </div>
      )}
    </div>
  );
}
