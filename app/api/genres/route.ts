// app/api/genres/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const tmdb = process.env.TMDB_API_KEY;
  if (!tmdb) return NextResponse.json({ genres: [] });

  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdb}&language=tr-TR`;

  // Burada revalidate ekledik (1 gün)
  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) return NextResponse.json({ genres: [] });

  const data = await r.json();
  return NextResponse.json(data);
}
