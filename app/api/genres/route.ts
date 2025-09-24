import { NextResponse } from "next/server";

export async function GET() {
  const api = process.env.TMDB_API_KEY;
  if (!api) return NextResponse.json({ map: {} });

  const r = await fetch(
    `https://api.themoviedb.org/3/genre/movie/list?api_key=${api}&language=tr-TR`,
    { next: { revalidate: 60 * 60 * 24 } } // 24s cache
  );
  const data = await r.json();
  const map: Record<number, string> = {};
  for (const g of data.genres ?? []) map[g.id] = g.name;
  return NextResponse.json({ map });
}
