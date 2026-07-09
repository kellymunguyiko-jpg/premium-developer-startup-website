import { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  Users,
  Sparkles,
  Clock,
  FolderKanban,
  BookOpen,
  BookMarked,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../types/user";
import { aiUsagePercent, formatDuration } from "../types/user";
import type { BookItem, CourseItem } from "../types/content";
import { BOOK_CATEGORIES, COURSE_LANGUAGES } from "../types/content";
import {
  fetchBooks,
  fetchCourses,
  removeBook,
  removeCourse,
  saveBook,
  saveCourse,
} from "../services/contentStore";
import { fetchVideos, removeVideo, saveVideo } from "../services/videos";
import type { VideoItem } from "../types/notifications";

export function AdminPage() {
  const { profile, listUsers, setUserBlocked } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "courses" | "books" | "videos">(
    "users"
  );
  const [saving, setSaving] = useState(false);
  const [blockBusy, setBlockBusy] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: "",
    language: "JavaScript",
    about: "",
    image: "",
    level: "Beginner" as CourseItem["level"],
    duration: "4h",
  });

  const [bookForm, setBookForm] = useState({
    name: "",
    category: "HTML",
    image: "",
    link: "",
    about: "",
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    about: "",
    image: "",
    videoUrl: "",
  });

  const reloadContent = async () => {
    const [c, b, v] = await Promise.all([
      fetchCourses(),
      fetchBooks(),
      fetchVideos(),
    ]);
    setCourses(c);
    setBooks(b);
    setVideos(v);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list] = await Promise.all([listUsers(), reloadContent()]);
        if (!cancelled) setUsers(list);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Failed to load users (check Firestore rules)"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listUsers]);

  if (!profile?.isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/30">
        <Shield className="mx-auto h-8 w-8 text-red-500" />
        <h2 className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">
          Admin access only
        </h2>
        <p className="mt-1 text-xs text-red-500">
          Sign in as admin from Settings → Admin Login.
        </p>
      </div>
    );
  }

  const totalAI = users.reduce((s, u) => s + (u.stats?.aiUses || 0), 0);
  const totalProjects = users.reduce(
    (s, u) => s + (u.stats?.totalProjects || 0),
    0
  );
  const totalHours = users.reduce((s, u) => s + (u.stats?.codingHours || 0), 0);

  const onAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveCourse({
      ...courseForm,
      createdBy: profile.uid,
      createdAt: Date.now(),
    });
    await reloadContent();
    setCourseForm({
      title: "",
      language: "JavaScript",
      about: "",
      image: "",
      level: "Beginner",
      duration: "4h",
    });
    setSaving(false);
  };

  const onAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveBook({
      ...bookForm,
      createdBy: profile.uid,
      createdAt: Date.now(),
    });
    await reloadContent();
    setBookForm({
      name: "",
      category: "HTML",
      image: "",
      link: "",
      about: "",
    });
    setSaving(false);
  };

  const onAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveVideo({
      ...videoForm,
      createdBy: profile.uid,
      createdAt: Date.now(),
    });
    await reloadContent();
    setVideoForm({ title: "", about: "", image: "", videoUrl: "" });
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <Shield className="h-6 w-6 text-green-600" />
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Users · upload courses · upload books
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Users" value={String(users.length)} />
        <StatCard
          icon={FolderKanban}
          label="Projects saved"
          value={String(totalProjects)}
        />
        <StatCard
          icon={Clock}
          label="Coding hours"
          value={`${totalHours.toFixed(1)}h`}
        />
        <StatCard icon={Sparkles} label="AI uses" value={String(totalAI)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "users", label: "Users", icon: Users },
            { id: "courses", label: "Courses", icon: BookOpen },
            { id: "books", label: "Books", icon: BookMarked },
            { id: "videos", label: "Videos", icon: Video },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              tab === t.id
                ? "bg-green-600 text-white"
                : "bg-green-50 text-slate-600 dark:bg-green-950 dark:text-slate-400"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="overflow-hidden rounded-2xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
          <div className="border-b border-green-50 px-4 py-3 dark:border-green-900/40">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Registered users
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-green-50/50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-green-950/30 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Projects</th>
                    <th className="px-4 py-3 font-semibold">Coding</th>
                    <th className="px-4 py-3 font-semibold">AI uses</th>
                    <th className="px-4 py-3 font-semibold">AI today</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50 dark:divide-green-900/30">
                  {users.map((u) => {
                    const pct = aiUsagePercent(u.stats);
                    const blocked = Boolean(u.blocked);
                    return (
                      <tr
                        key={u.uid}
                        className={blocked ? "bg-red-50/70 dark:bg-red-950/20" : undefined}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                u.photoURL ||
                                `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.uid}&backgroundColor=bbf7d0`
                              }
                              alt=""
                              className="h-8 w-8 rounded-full bg-green-100"
                            />
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {u.displayName}
                                {blocked && (
                                  <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    BLOCKED
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {u.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {u.stats?.totalProjects ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          {(u.stats?.codingHours ?? 0).toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">{u.stats?.aiUses ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
                              <div
                                className="h-full rounded-full bg-green-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {pct}% · {formatDuration(u.stats?.aiUsedMs || 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.isAdmin ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950 dark:text-green-400">
                              Admin
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!u.isAdmin && (
                            <button
                              disabled={blockBusy === u.uid}
                              onClick={() => {
                                void (async () => {
                                  setBlockBusy(u.uid);
                                  try {
                                    const reason = blocked
                                      ? ""
                                      : window.prompt(
                                          "Block reason (optional)",
                                          "Violated platform rules"
                                        ) || "Blocked by admin";
                                    await setUserBlocked(
                                      u.uid,
                                      !blocked,
                                      reason
                                    );
                                    const list = await listUsers();
                                    setUsers(list);
                                  } catch (e) {
                                    alert(
                                      e instanceof Error
                                        ? e.message
                                        : "Failed to update block status"
                                    );
                                  } finally {
                                    setBlockBusy(null);
                                  }
                                })();
                              }}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                                blocked
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              {blockBusy === u.uid
                                ? "..."
                                : blocked
                                  ? "Unblock"
                                  : "Block"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "courses" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={onAddCourse}
            className="space-y-3 rounded-2xl border border-green-50 bg-white p-5 dark:border-green-900/40 dark:bg-[#111814]"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Plus className="h-4 w-4 text-green-600" />
              Upload course
            </h2>
            <input
              required
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Course title"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <select
              value={courseForm.language}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, language: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            >
              {COURSE_LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              required
              value={courseForm.image}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, image: e.target.value }))
              }
              placeholder="Image URL"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <textarea
              required
              value={courseForm.about}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, about: e.target.value }))
              }
              placeholder="About this course"
              rows={3}
              className="w-full rounded-xl border border-green-100 px-3 py-2 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={courseForm.level}
                onChange={(e) =>
                  setCourseForm((f) => ({
                    ...f,
                    level: e.target.value as CourseItem["level"],
                  }))
                }
                className="h-10 rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <input
                value={courseForm.duration}
                onChange={(e) =>
                  setCourseForm((f) => ({ ...f, duration: e.target.value }))
                }
                placeholder="Duration e.g. 6h"
                className="h-10 rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
              />
            </div>
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Publish course
            </button>
          </form>

          <div className="space-y-2 rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Existing courses ({courses.length})
            </h3>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-green-50 p-2 dark:border-green-900/30"
                >
                  <img
                    src={c.image}
                    alt=""
                    className="h-12 w-16 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{c.language}</p>
                  </div>
                  <button
                    onClick={() =>
                      void removeCourse(c.id).then(reloadContent)
                    }
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "books" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={onAddBook}
            className="space-y-3 rounded-2xl border border-green-50 bg-white p-5 dark:border-green-900/40 dark:bg-[#111814]"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Plus className="h-4 w-4 text-green-600" />
              Upload book
            </h2>
            <input
              required
              value={bookForm.name}
              onChange={(e) =>
                setBookForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Book name"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <select
              value={bookForm.category}
              onChange={(e) =>
                setBookForm((f) => ({ ...f, category: e.target.value }))
              }
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            >
              {BOOK_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              required
              value={bookForm.image}
              onChange={(e) =>
                setBookForm((f) => ({ ...f, image: e.target.value }))
              }
              placeholder="Cover image URL"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <input
              required
              value={bookForm.link}
              onChange={(e) =>
                setBookForm((f) => ({ ...f, link: e.target.value }))
              }
              placeholder="Book link (opens inside site)"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <textarea
              required
              value={bookForm.about}
              onChange={(e) =>
                setBookForm((f) => ({ ...f, about: e.target.value }))
              }
              placeholder="About this book"
              rows={3}
              className="w-full rounded-xl border border-green-100 px-3 py-2 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Publish book
            </button>
          </form>

          <div className="space-y-2 rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Existing books ({books.length})
            </h3>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-green-50 p-2 dark:border-green-900/30"
                >
                  <img
                    src={b.image}
                    alt=""
                    className="h-12 w-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {b.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{b.category}</p>
                  </div>
                  <button
                    onClick={() => void removeBook(b.id).then(reloadContent)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "videos" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form
            onSubmit={onAddVideo}
            className="space-y-3 rounded-2xl border border-green-50 bg-white p-5 dark:border-green-900/40 dark:bg-[#111814]"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Plus className="h-4 w-4 text-green-600" />
              Upload video
            </h2>
            <input
              required
              value={videoForm.title}
              onChange={(e) =>
                setVideoForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Video title"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <input
              required
              value={videoForm.image}
              onChange={(e) =>
                setVideoForm((f) => ({ ...f, image: e.target.value }))
              }
              placeholder="Thumbnail image URL"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <input
              required
              value={videoForm.videoUrl}
              onChange={(e) =>
                setVideoForm((f) => ({ ...f, videoUrl: e.target.value }))
              }
              placeholder="Video URL (YouTube or direct)"
              className="h-10 w-full rounded-xl border border-green-100 px-3 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <textarea
              required
              value={videoForm.about}
              onChange={(e) =>
                setVideoForm((f) => ({ ...f, about: e.target.value }))
              }
              placeholder="About this video"
              rows={3}
              className="w-full rounded-xl border border-green-100 px-3 py-2 text-sm dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100"
            />
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Publish video
            </button>
          </form>

          <div className="space-y-2 rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Existing videos ({videos.length})
            </h3>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 rounded-xl border border-green-50 p-2 dark:border-green-900/30"
                >
                  <img
                    src={v.image}
                    alt=""
                    className="h-12 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {v.title}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {v.videoUrl}
                    </p>
                  </div>
                  <button
                    onClick={() => void removeVideo(v.id).then(reloadContent)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-green-50 bg-white p-4 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
