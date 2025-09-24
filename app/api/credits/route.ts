// app/api/credits/route.ts
import { NextResponse } from "next/server";

// TMDb API'den dönen oyuncu tipi
type TMDBCast = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ cast: [] });

  const tmdb = process.env.TMDB_API_KEY;
  if (!tmdb) return NextResponse.json({ cast: [] });

  const url = `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${tmdb}&language=tr-TR`;

  // Revalidate: 1 gün
  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) return NextResponse.json({ cast: [] });

  const data: { cast?: TMDBCast[] } = await r.json();
  const cast = (data.cast || []).slice(0, 5).map((c) => c.name);
  return NextResponse.json({ cast });
}
