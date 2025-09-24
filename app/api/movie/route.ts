import { NextResponse } from "next/server";

type TMDBMovie = {
  id: number;
  genres?: { id: number; name: string }[];
  vote_average?: number;
};

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const api = process.env.TMDB_API_KEY;
  if (!api) return NextResponse.json({ error: "api key yok" }, { status: 500 });

  const r = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${api}&language=tr-TR`,
    { cache: "no-store" }
  );
  if (!r.ok) return NextResponse.json({ error: "TMDb hata" }, { status: 502 });

  const d = (await r.json()) as TMDBMovie;

  return NextResponse.json({
    id: d.id,
    genres: (d.genres ?? []).map((g) => g.name),
    rating: typeof d.vote_average === "number" ? d.vote_average : null,
  });
}
