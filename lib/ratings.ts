// lib/ratings.ts
type TMDBExternal = { imdb_id?: string | null };
type OMDbRating = { Source: string; Value: string };
type OMDbResponse = { Ratings?: OMDbRating[] };

function parseRatings(data: OMDbResponse): {
  imdb: number | null;
  rt: number | null;
} {
  let imdb: number | null = null;
  let rt: number | null = null;
  for (const r of data.Ratings ?? []) {
    if (r.Source === "Internet Movie Database") {
      const v = parseFloat((r.Value || "").split("/")[0]);
      if (!Number.isNaN(v)) imdb = v;
    }
    if (r.Source === "Rotten Tomatoes") {
      const p = parseInt((r.Value || "").replace("%", ""), 10);
      if (!Number.isNaN(p)) rt = p;
    }
  }
  return { imdb, rt };
}

/** TMDb external_ids -> imdb_id -> OMDb rating(ler). 6 saat cache. */
export async function getRatings(
  tmdbId: number
): Promise<{ imdb: number | null; rt: number | null }> {
  const tmdbKey = process.env.TMDB_API_KEY;
  const omdbKey = process.env.OMDB_API_KEY;
  if (!tmdbKey || !omdbKey) return { imdb: null, rt: null };

  const r1 = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${tmdbKey}`,
    { next: { revalidate: 21600 } }
  );
  if (!r1.ok) return { imdb: null, rt: null };
  const ext: TMDBExternal = await r1.json();
  const imdbId = ext.imdb_id;
  if (!imdbId) return { imdb: null, rt: null };

  const r2 = await fetch(
    `https://www.omdbapi.com/?apikey=${omdbKey}&i=${imdbId}`,
    { next: { revalidate: 21600 } }
  );
  if (!r2.ok) return { imdb: null, rt: null };
  const data: OMDbResponse = await r2.json();
  return parseRatings(data);
}
