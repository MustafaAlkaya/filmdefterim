import { NextResponse } from "next/server";
import { ensureTable, fetchList, addItem, removeItem } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

type AddItemBody = {
  tmdb_id: number;
  title: string;
  year?: number;
  poster_url?: string | null;
};

export async function GET() {
  try {
    await ensureTable();
    const rows = await fetchList();
    return NextResponse.json({ items: rows });
  } catch (e: unknown) {
    console.error("List GET error:", e);
    // DB yoksa bile boş liste döndür
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

    // year: sayı değilse undefined yap
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
