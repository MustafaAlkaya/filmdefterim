// app/api/movie/route.ts
import { NextResponse } from "next/server";

type TMDbGenre = { id: number; name: string };
type TMDbMovie = {
  id: number;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  genres?: TMDbGenre[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "TMDB_API_KEY yok" }, { status: 500 });
  }

  try {
    // Detayları TR dilinde al
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=tr-TR`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 1 gün
    if (!res.ok) {
      return NextResponse.json({ error: "TMDb hata" }, { status: res.status });
    }

    const m = (await res.json()) as TMDbMovie;

    // İsim listesini çıkar
    const genres = (m.genres ?? []).map((g) => g.name);

    return NextResponse.json({
      id: m.id,
      title: m.title,
      overview: m.overview ?? null,
      poster_path: m.poster_path ?? null,
      backdrop_path: m.backdrop_path ?? null,
      release_date: m.release_date ?? null,
      rating: typeof m.vote_average === "number" ? m.vote_average : null,
      genres,
    });
  } catch (e) {
    console.error("movie GET error:", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
