// lib/ratings.ts
type TMDBExternal = { imdb_id?: string | null };

type OMDbResponse = {
  Ratings?: { Source: string; Value: string }[];
};

function parseImdbRating(data: OMDbResponse): number | null {
  for (const r of data.Ratings ?? []) {
    if (r.Source === "Internet Movie Database") {
      const v = parseFloat((r.Value || "").split("/")[0]);
      if (!Number.isNaN(v)) return v;
    }
  }
  return null;
}

/**
 * TMDb external_ids -> imdb_id -> OMDb rating zinciri.
 * Sonuç: IMDb puanı (0–10) ya da null.
 * Cache (revalidate): 6 saat
 */
export async function getIMDbRating(tmdbId: number): Promise<number | null> {
  const tmdbKey = process.env.TMDB_API_KEY;
  const omdbKey = process.env.OMDB_API_KEY;
  if (!tmdbKey || !omdbKey) return null;

  // 1) TMDb'den imdb_id al
  const r1 = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${tmdbKey}`,
    { next: { revalidate: 21600 } } // 6 saat
  );
  if (!r1.ok) return null;
  const ext: TMDBExternal = await r1.json();
  const imdbId = ext.imdb_id;
  if (!imdbId) return null;

  // 2) OMDb'den rating al
  const r2 = await fetch(
    `https://www.omdbapi.com/?apikey=${omdbKey}&i=${imdbId}`,
    { next: { revalidate: 21600 } } // 6 saat
  );
  if (!r2.ok) return null;
  const data: OMDbResponse = await r2.json();
  return parseImdbRating(data);
}
