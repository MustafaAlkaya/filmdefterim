import { NextResponse } from "next/server";

type TMDBExternal = { imdb_id?: string | null };

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const tmdb = process.env.TMDB_API_KEY;
  const omdb = process.env.OMDB_API_KEY;
  if (!tmdb || !omdb) return NextResponse.json({ imdb: null, rt: null });

  // 1) TMDb'den imdb_id al
  const r1 = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/external_ids?api_key=${tmdb}`,
    { cache: "no-store" }
  );
  if (!r1.ok) return NextResponse.json({ imdb: null, rt: null });
  const ext = (await r1.json()) as TMDBExternal;
  const imdbId = ext.imdb_id;
  if (!imdbId) return NextResponse.json({ imdb: null, rt: null });

  // 2) OMDb'den puanları çek
  const r2 = await fetch(
    `https://www.omdbapi.com/?apikey=${omdb}&i=${imdbId}`,
    { cache: "no-store" }
  );
  if (!r2.ok) return NextResponse.json({ imdb: null, rt: null });
  const data = await r2.json();

  let imdb: number | null = null;
  let rt: number | null = null;
  const ratings: Array<{ Source: string; Value: string }> = data.Ratings || [];
  for (const it of ratings) {
    if (it.Source === "Internet Movie Database") {
      // "7.9/10" → 7.9
      const v = parseFloat((it.Value || "").split("/")[0]);
      if (!Number.isNaN(v)) imdb = v;
    }
    if (it.Source === "Rotten Tomatoes") {
      // "94%" → 94
      const pct = parseInt((it.Value || "").replace("%", ""), 10);
      if (!Number.isNaN(pct)) rt = pct;
    }
  }

  return NextResponse.json({ imdb, rt });
}
