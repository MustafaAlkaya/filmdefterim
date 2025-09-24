// app/api/ratings/route.ts
import { NextResponse } from "next/server";

type TMDBExternal = { imdb_id?: string | null };

// OMDb response için type
type OMDbResponse = {
  Ratings?: { Source: string; Value: string }[];
};

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const tmdb = process.env.TMDB_API_KEY;
  const omdb = process.env.OMDB_API_KEY;
  if (!tmdb || !omdb) return NextResponse.json({ imdb: null, rt: null });

  // 1) TMDb’den imdb_id al (cache 6 saat)
  const r1 = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/external_ids?api_key=${tmdb}`,
    { next: { revalidate: 21600 } }
  );
  if (!r1.ok) return NextResponse.json({ imdb: null, rt: null });
  const ext: TMDBExternal = await r1.json();
  const imdbId = ext.imdb_id;
  if (!imdbId) return NextResponse.json({ imdb: null, rt: null });

  // 2) OMDb’den puanları çek (cache 6 saat)
  const r2 = await fetch(
    `https://www.omdbapi.com/?apikey=${omdb}&i=${imdbId}`,
    { next: { revalidate: 21600 } }
  );
  if (!r2.ok) return NextResponse.json({ imdb: null, rt: null });
  const data: OMDbResponse = await r2.json();

  let imdb: number | null = null;
  let rt: number | null = null;

  for (const it of data.Ratings ?? []) {
    if (it.Source === "Internet Movie Database") {
      const v = parseFloat((it.Value || "").split("/")[0]);
      if (!Number.isNaN(v)) imdb = v;
    }
    if (it.Source === "Rotten Tomatoes") {
      const pct = parseInt((it.Value || "").replace("%", ""), 10);
      if (!Number.isNaN(pct)) rt = pct;
    }
  }

  return NextResponse.json({ imdb, rt });
}
