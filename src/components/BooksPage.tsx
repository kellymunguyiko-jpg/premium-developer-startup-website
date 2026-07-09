import { useEffect, useMemo, useState } from "react";
import { BookMarked, ExternalLink, Loader2, Search, X } from "lucide-react";
import { fetchBooks } from "../services/contentStore";
import type { BookItem } from "../types/content";
import { BOOK_CATEGORIES } from "../types/content";
import { cn } from "../utils/cn";

export function BooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [reader, setReader] = useState<BookItem | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setBooks(await fetchBooks());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchCat = category === "All" || b.category === category;
      const text = `${b.name} ${b.about} ${b.category}`.toLowerCase();
      return matchCat && (!q.trim() || text.includes(q.toLowerCase()));
    });
  }, [books, category, q]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Books
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Categories: HTML, CSS, JS, PHP… · open books inside DevSpace
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search books..."
            className="h-11 w-full rounded-xl border border-green-100 bg-white pl-10 pr-3 text-sm outline-none focus:border-green-300 dark:border-green-900/50 dark:bg-[#111814] dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...BOOK_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-all",
                category === c
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-slate-600 hover:bg-green-100 dark:bg-green-950 dark:text-slate-400"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((book) => (
            <article
              key={book.id}
              className="overflow-hidden rounded-2xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#111814]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-green-50 dark:bg-green-950">
                <img
                  src={book.image}
                  alt={book.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-600">
                  {book.category}
                </span>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                  {book.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                  {book.about}
                </p>
                <button
                  onClick={() => setReader(book)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  Open in site
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* In-app reader (no new tab) */}
      {reader && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/50 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between border-b border-green-100 bg-white px-4 dark:border-green-900/40 dark:bg-[#0d1210]">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {reader.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {reader.category} · reading inside DevSpace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={reader.link}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-green-50 sm:flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                External
              </a>
              <button
                onClick={() => setReader(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <iframe
            title={reader.name}
            src={reader.link}
            className="min-h-0 flex-1 w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
    </div>
  );
}
