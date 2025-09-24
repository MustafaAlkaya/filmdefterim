// types/list-item.ts
export interface ListItem {
  tmdb_id: number;
  title: string;
  year?: number | null;
  poster_url?: string | null;
  added_at?: string;
  added_by?: string | null;
}
