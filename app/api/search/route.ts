// app/api/search/route.ts
import { NextResponse } from "next/server";
import { getIMDbRating } from "@/lib/ratings";

type TMDBMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q) return NextResponse.json({ results: [] });

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${
    process.env.TMDB_API_KEY
  }&query=${encodeURIComponent(q)}&language=tr-TR`;
  const tmdb = await fetch(url, { next: { revalidate: 0 } });
  if (!tmdb.ok) return NextResponse.json({ results: [] });

  const data = await tmdb.json();
  const movies: TMDBMovie[] = data?.results ?? [];

  // IMDb puanlarını topla
  const withRatings = await Promise.all(
    movies.map(async (m) => {
      const imdb = await getIMDbRating(m.id);
      return { ...m, imdb };
    })
  );

  // IMDb’ye göre sırala (yüksek → düşük, null en sona)
  withRatings.sort((a, b) => {
    if (a.imdb == null && b.imdb == null) return 0;
    if (a.imdb == null) return 1;
    if (b.imdb == null) return -1;
    return b.imdb - a.imdb;
  });

  return NextResponse.json({ results: withRatings });
}
