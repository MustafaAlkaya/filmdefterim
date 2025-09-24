import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import AuthMenu from "@/components/AuthMenu";
import ToastHost from "@/components/ToastHost";

export const metadata = {
  title: "FilmDefterim",
  description:
    "Mustafa'nın herkese açık film listesi. Filmleri ara, listeyi keşfet.",
  openGraph: {
    title: "FilmDefterim",
    description: "Mustafa'nın herkese açık film listesi.",
    type: "website",
    url: "https://filmdefterim-5rkel46z8-mustafas-projects-8511e92d.vercel.app", // prod URL'inle değiştir
    images: [
      {
        url: "https://image.tmdb.org/t/p/w500/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg",
      }, // geçici bir poster; istersen kaldır
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FilmDefterim",
    description: "Mustafa'nın herkese açık film listesi.",
  },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/?reset=1"
              className="text-xl font-bold text-orange-500"
            >
              FilmDefterim
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="hover:underline">
                Film Arama
              </Link>
              <Link href="/list" className="hover:underline">
                Favori Listesi
              </Link>
              <AuthMenu />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <ToastHost />
      </body>
    </html>
  );
}
