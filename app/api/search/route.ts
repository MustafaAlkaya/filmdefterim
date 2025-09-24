import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q) return NextResponse.json({ results: [] });

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${
    process.env.TMDB_API_KEY
  }&query=${encodeURIComponent(q)}&language=tr-TR`;
  const tmdb = await fetch(url, { next: { revalidate: 0 } });
  const data = await tmdb.json();
  return NextResponse.json(data);
}
