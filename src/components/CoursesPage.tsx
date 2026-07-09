import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, Filter, Loader2, Search } from "lucide-react";
import { fetchCourses } from "../services/contentStore";
import type { CourseItem } from "../types/content";
import { COURSE_LANGUAGES } from "../types/content";
import { cn } from "../utils/cn";

export function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("All");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const items = await fetchCourses();
      setCourses(items);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchLang = lang === "All" || c.language === lang;
      const text = `${c.title} ${c.about} ${c.language}`.toLowerCase();
      const matchQ = !q.trim() || text.includes(q.toLowerCase());
      return matchLang && matchQ;
    });
  }, [courses, lang, q]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Courses
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          All programming languages · image · about · uploaded by admin
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses..."
            className="h-11 w-full rounded-xl border border-green-100 bg-white pl-10 pr-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-[#111814] dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-green-600" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="h-11 rounded-xl border border-green-100 bg-white px-3 text-sm outline-none dark:border-green-900/50 dark:bg-[#111814] dark:text-slate-100"
          >
            <option value="All">All languages</option>
            {COURSE_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-2xl border border-green-50 bg-white shadow-sm transition-all hover:shadow-md dark:border-green-900/40 dark:bg-[#111814]"
            >
              <div className="relative h-40 overflow-hidden bg-green-50 dark:bg-green-950">
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-bold text-white">
                  {course.language}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {course.about}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-green-600" />
                    {course.level}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.duration}
                  </span>
                </div>
                <button
                  className={cn(
                    "mt-3 w-full rounded-xl bg-green-600 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700"
                  )}
                >
                  Start course
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-slate-400">
              No courses found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
