// types/movie.ts
export interface Movie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number; // eklendi
  genre_ids?: number[]; // eklendi (search sonuçlarından geliyor)
}
