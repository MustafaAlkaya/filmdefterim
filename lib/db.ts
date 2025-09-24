// lib/db.ts
import { sql } from "@vercel/postgres";

export async function ensureTable() {
  await sql/*sql*/ `
    CREATE TABLE IF NOT EXISTS list_items (
      id SERIAL PRIMARY KEY,
      tmdb_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      year INTEGER,
      poster_url TEXT,
      added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      added_by TEXT
    );
  `;
}

export async function fetchList() {
  const { rows } = await sql/*sql*/ `
    SELECT * FROM list_items
    ORDER BY added_at DESC;
  `;
  return rows;
}

export async function addItem(item: {
  tmdb_id: number;
  title: string;
  year?: number;
  poster_url?: string | null;
  added_by?: string | null;
}) {
  await sql/*sql*/ `
    INSERT INTO list_items (tmdb_id, title, year, poster_url, added_by)
    VALUES (${item.tmdb_id}, ${item.title}, ${item.year ?? null}, ${
    item.poster_url ?? null
  }, ${item.added_by ?? null})
    ON CONFLICT (tmdb_id) DO NOTHING;
  `;
}

export async function removeItem(tmdb_id: number) {
  await sql/*sql*/ `DELETE FROM list_items WHERE tmdb_id = ${tmdb_id};`;
}
