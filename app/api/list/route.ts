import { NextResponse } from "next/server";
import { ensureTable, fetchList, addItem, removeItem } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await ensureTable();
    const rows = await fetchList();
    return NextResponse.json({ items: rows });
  } catch (e) {
    console.error("List GET error:", e);
    // DB yoksa bile boş liste döndür
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tmdb_id, title, year, poster_url } = body || {};
    if (!tmdb_id || !title) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
    }

    await ensureTable();
    await addItem({
      tmdb_id: Number(tmdb_id),
      title,
      year: year ? Number(year) : undefined,
      poster_url: poster_url ?? null,
      added_by: "admin",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("List POST error:", e);
    return NextResponse.json(
      { error: "Veritabanı yapılandırılmadı" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("tmdb_id");
    if (!id) {
      return NextResponse.json({ error: "tmdb_id gerekli" }, { status: 400 });
    }

    await ensureTable();
    await removeItem(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("List DELETE error:", e);
    return NextResponse.json(
      { error: "Veritabanı yapılandırılmadı" },
      { status: 500 }
    );
  }
}
