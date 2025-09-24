import { NextResponse } from "next/server";

type CastItem = { name: string };

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const tmdb = process.env.TMDB_API_KEY;
  if (!tmdb) return NextResponse.json({ cast: [] });

  const r = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${tmdb}&language=tr-TR`,
    { cache: "no-store" }
  );
  if (!r.ok) return NextResponse.json({ cast: [] });

  const d = await r.json();
  const cast: string[] =
    (d.cast as CastItem[] | undefined)?.slice(0, 3).map((c) => c.name) ?? [];
  return NextResponse.json({ cast });
}
