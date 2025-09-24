import { NextResponse } from "next/server";
import { ensureTable, fetchList, addItem, removeItem } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getIMDbRating } from "@/lib/ratings";

type AddItemBody = {
  tmdb_id: number;
  title: string;
  year?: number;
  poster_url?: string | null;
};

type ListItem = {
  id: number;
  tmdb_id: number;
  title: string;
  year?: number | null;
  poster_url?: string | null;
  added_at?: string;
  added_by?: string | null;
};

// Basit batch (concurrency) işleyici: aynı anda en çok N istek
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: R[] = new Array(items.length) as R[];
  let i = 0;

  async function run() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await worker(items[idx]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return ret;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = (await fetchList()) as ListItem[];

    // IMDb puanlarını sınırlı eşzamanlılıkla topla (örn. 8)
    const withRatings = await mapWithConcurrency(rows, 8, async (row) => {
      const imdb = await getIMDbRating(row.tmdb_id);
      return { row, imdb };
    });

    // IMDb’ye göre sırala: yüksek → düşük, null en sona
    withRatings.sort((a, b) => {
      if (a.imdb == null && b.imdb == null) return 0;
      if (a.imdb == null) return 1;
      if (b.imdb == null) return -1;
      return (b.imdb as number) - (a.imdb as number);
    });

    const sorted = withRatings.map((x) => x.row);
    return NextResponse.json({ items: sorted });
  } catch (e: unknown) {
    console.error("List GET error:", e);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  const ok = await isAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const body: AddItemBody = await req.json();

    if (!body?.tmdb_id || !body?.title) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
    }

    const year =
      typeof body.year === "number" && Number.isFinite(body.year)
        ? body.year
        : undefined;

    await ensureTable();
    await addItem({
      tmdb_id: Number(body.tmdb_id),
      title: body.title,
      year,
      poster_url: body.poster_url ?? null,
      added_by: "admin",
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("List POST error:", e);
    return NextResponse.json(
      { error: "Veritabanı yapılandırılmadı" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const ok = await isAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("tmdb_id");
    const idNum = idStr ? Number(idStr) : NaN;

    if (!Number.isFinite(idNum)) {
      return NextResponse.json(
        { error: "tmdb_id gerekli ve sayı olmalı" },
        { status: 400 }
      );
    }

    await ensureTable();
    await removeItem(idNum);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("List DELETE error:", e);
    return NextResponse.json(
      { error: "Veritabanı yapılandırılmadı" },
      { status: 500 }
    );
  }
}
