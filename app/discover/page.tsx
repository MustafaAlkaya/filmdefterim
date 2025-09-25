// app/discover/page.tsx
import Link from "next/link";

type TMDBMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
};

async function fetchTMDb(path: string) {
  const key = process.env.TMDB_API_KEY!;
  const url = `https://api.themoviedb.org/3${path}?api_key=${key}&language=tr-TR`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // 1 saat cache
  if (!res.ok) return { results: [] as TMDBMovie[] };
  return res.json() as Promise<{ results: TMDBMovie[] }>;
}

export default async function DiscoverPage() {
  const [popular, nowPlaying, upcoming] = await Promise.all([
    fetchTMDb("/movie/popular"),
    fetchTMDb("/movie/now_playing"),
    fetchTMDb("/movie/upcoming"),
  ]);

  const sections: { title: string; data: TMDBMovie[] }[] = [
    { title: "Popüler", data: popular.results },
    { title: "Vizyonda", data: nowPlaying.results },
    { title: "Yakında", data: upcoming.results },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-orange-500">
        Keşfet
      </h1>

      {sections.map((sec) => (
        <section key={sec.title} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{sec.title}</h2>
            <span className="text-xs text-neutral-400">
              Sıralama: TMDb popülerlik
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {sec.data.slice(0, 15).map((m) => (
              <Link
                key={m.id}
                href={`/movie/${m.id}`}
                className="card overflow-hidden group transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-neutral-900">
                  {m.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                      alt={m.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-neutral-600 text-sm">
                      Poster yok
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 font-semibold">{m.title}</div>
                  <div className="text-sm text-neutral-400">
                    {m.release_date?.slice(0, 4) || "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
