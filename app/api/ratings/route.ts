// app/api/ratings/route.ts
export const runtime = "nodejs"; // env erişimini garanti et
export const dynamic = "force-dynamic"; // teşhis için cache'i by-pass et (sonra kaldırabiliriz)

import { NextResponse } from "next/server";

type TMDBExternal = { imdb_id?: string | null };
type OMDbResp = {
  Response?: string;
  Error?: string;
  Ratings?: { Source: string; Value: string }[];
};
type TMDBDetails = { vote_average?: number | null };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const debug = url.searchParams.get("debug") === "1";

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const TMDB = process.env.TMDB_API_KEY || "";
  const OMDB = process.env.OMDB_API_KEY || "";

  // ---- 1) TMDb -> IMDb id
  let imdbId: string | null = null;
  let imdb: number | null = null;
  let rt: number | null = null;
  const notes: Record<string, unknown> = {};

  try {
    const extRes = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/external_ids?api_key=${TMDB}`,
      { cache: "no-store" }
    );
    if (extRes.ok) {
      const ext: TMDBExternal = await extRes.json();
      imdbId = ext.imdb_id ?? null;
    } else {
      notes.tmdb_external_status = extRes.status;
    }
  } catch (e) {
    notes.tmdb_external_err = String(e);
  }

  // ---- 2) OMDb (varsa) dene
  if (imdbId && OMDB) {
    try {
      const omdbRes = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB}&i=${imdbId}&tomatoes=true`,
        { cache: "no-store" }
      );
      const raw: OMDbResp = await omdbRes.json().catch(() => ({} as OMDbResp));
      notes.omdb_raw = raw;

      if (omdbRes.ok && raw.Response !== "False") {
        for (const r of raw.Ratings ?? []) {
          if (r.Source === "Internet Movie Database") {
            const v = parseFloat((r.Value ?? "").split("/")[0]);
            if (!Number.isNaN(v)) imdb = v;
          }
          if (r.Source === "Rotten Tomatoes") {
            const pct = parseInt((r.Value ?? "").replace("%", ""), 10);
            if (!Number.isNaN(pct)) rt = pct;
          }
        }
      } else {
        notes.omdb_status = omdbRes.status;
      }
    } catch (e) {
      notes.omdb_err = String(e);
    }
  } else {
    if (!imdbId) notes.no_imdb_id = true;
    if (!OMDB) notes.no_omdb_key = true;
  }

  // ---- 3) Fallback: IMDb boşsa TMDb vote_average
  if (imdb == null) {
    try {
      const detRes = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB}&language=tr-TR`,
        { cache: "no-store" }
      );
      if (detRes.ok) {
        const det: TMDBDetails = await detRes.json();
        if (typeof det.vote_average === "number") {
          imdb = Math.round(det.vote_average * 10) / 10;
          notes.fallback_used = true;
        } else {
          notes.no_vote_average = true;
        }
      } else {
        notes.tmdb_details_status = detRes.status;
      }
    } catch (e) {
      notes.tmdb_details_err = String(e);
    }
  }

  const payload = { imdb, rt };
  if (debug) {
    // Teşhis amaçlı ayrıntı görmek istersen ?debug=1 ekle
    return NextResponse.json({
      ...payload,
      _debug: {
        hasEnv: { OMDB: !!OMDB, TMDB: !!TMDB },
        imdbId,
        ...notes,
      },
    });
  }
  return NextResponse.json(payload);
}
