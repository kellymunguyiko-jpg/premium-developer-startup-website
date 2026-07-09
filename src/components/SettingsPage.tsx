import { useEffect, useState } from "react";
import {
  Loader2,
  Save,
  User,
  Shield,
  AlertTriangle,
  CloudOff,
  Cloud,
  Download,
  RefreshCw,
  Trash2,
  Smartphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AIUsageBar } from "./AIUsageBar";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { APP_VERSION } from "../types/user";

export function SettingsPage({
  onOpenAdmin,
}: {
  onOpenAdmin?: () => void;
}) {
  const {
    profile,
    updateUserProfile,
    user,
    signInAdmin,
    error: authError,
    clearError,
    firestoreReady,
    logout,
  } = useAuth();
  const { canInstall, isInstalled, install, clearCache, updateApp } =
    usePWAInstall();
  const [pwaMsg, setPwaMsg] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin login form (inside Settings)
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName || "");
    setRole(profile.role || "");
    setBio(profile.bio || "");
    setPhotoURL(profile.photoURL || "");
    setPhone(profile.phone || "");
  }, [profile]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        role: role.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim() || undefined,
        phone: phone.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAdminMsg(null);
    setAdminBusy(true);
    try {
      await signInAdmin(adminEmail.trim(), adminPassword);
      setAdminMsg("Admin access granted. Open Admin from the sidebar.");
      onOpenAdmin?.();
    } catch {
      /* authError */
    } finally {
      setAdminBusy(false);
    }
  };

  if (!profile || !user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Profile, AI usage & admin access
        </p>
      </div>

      {/* Sync status */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
          firestoreReady
            ? "border-green-100 bg-green-50/50 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300"
            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        }`}
      >
        {firestoreReady ? (
          <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div>
          <p className="font-bold">
            {firestoreReady
              ? "Cloud sync is working"
              : "Local mode (Firestore permissions)"}
          </p>
          <p className="mt-0.5 opacity-90">
            {firestoreReady
              ? "Your profile & stats are saving to Firebase."
              : "Missing Firestore rules. Profile still works on this device. Fix rules in Firebase Console → Firestore → Rules."}
          </p>
          {!firestoreReady && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/5 p-2 text-[10px] leading-relaxed dark:bg-black/20">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}`}
            </pre>
          )}
        </div>
      </div>

      <AIUsageBar />

      {/* Profile form */}
      <form
        onSubmit={onSave}
        className="space-y-4 rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814] sm:p-6"
      >
        <div className="flex items-center gap-4">
          <img
            src={
              photoURL ||
              profile.photoURL ||
              `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.uid}&backgroundColor=bbf7d0`
            }
            alt={displayName}
            className="h-16 w-16 rounded-full bg-green-100 ring-4 ring-green-50 dark:bg-green-900 dark:ring-green-900/40"
          />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <User className="h-4 w-4 text-green-600" />
              Profile
            </p>
            <p className="text-xs text-slate-400">{profile.email}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
              {profile.provider} · {profile.isAdmin ? "Admin" : "User"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Role / title
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Full Stack Developer"
              className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Photo URL
            </label>
            <input
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Phone number (for Call in Community / Messages)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 7xx xxx xxx"
              className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the community about you..."
              className="w-full resize-none rounded-xl border border-green-100 bg-green-50/30 px-3 py-2.5 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-60 dark:shadow-green-900/30"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save profile"}
        </button>
      </form>

      {/* Admin Login section */}
      {/* PWA / Install App */}
      <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814] sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              App & Install
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Install DevSpace as a mobile/desktop app (PWA)
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {canInstall && !isInstalled && (
            <button
              onClick={() =>
                void install().then((ok) =>
                  setPwaMsg(ok ? "App install started" : "Install dismissed")
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          )}
          {isInstalled && (
            <div className="rounded-xl bg-green-50 px-4 py-2.5 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-400">
              App is installed
            </div>
          )}
          {!canInstall && !isInstalled && (
            <div className="rounded-xl border border-green-100 px-4 py-2.5 text-xs text-slate-500 dark:border-green-900/40">
              Install prompt unavailable. On mobile: browser menu → Add to Home
              Screen.
            </div>
          )}
          <button
            onClick={() =>
              void updateApp().then(() => setPwaMsg("Checking for updates…"))
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-xs font-bold text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
          >
            <RefreshCw className="h-4 w-4" />
            Update app
          </button>
          <button
            onClick={() =>
              void clearCache().then(() =>
                setPwaMsg("Cache cleared. Reload recommended.")
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900"
          >
            <Trash2 className="h-4 w-4" />
            Clear cache
          </button>
          <div className="rounded-xl bg-green-50/50 px-4 py-2.5 text-xs text-slate-600 dark:bg-green-950/30 dark:text-slate-300">
            App version: <strong>v{APP_VERSION}</strong>
          </div>
        </div>
        {pwaMsg && (
          <p className="mt-3 text-xs font-semibold text-green-700 dark:text-green-400">
            {pwaMsg}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814] sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Admin Login
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Sign in with Firebase email & password to unlock the Admin panel
              on the sidebar.
            </p>
          </div>
        </div>

        {profile.isAdmin ? (
          <div className="rounded-xl border border-green-100 bg-green-50/50 px-4 py-3 text-xs text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
            You already have admin access. Use{" "}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="font-bold underline"
            >
              Admin
            </button>{" "}
            in the sidebar.
          </div>
        ) : (
          <form onSubmit={onAdminLogin} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Admin email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/20 dark:text-slate-100 dark:focus:border-green-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {(authError || adminMsg) && (
              <div
                className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                  adminMsg
                    ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {adminMsg || authError}
              </div>
            )}

            <button
              type="submit"
              disabled={adminBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-700"
            >
              {adminBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Sign in as Admin
            </button>
            <p className="text-[10px] text-slate-400">
              This switches the current session to the admin Firebase account
              (email/password user created in Firebase Auth).
            </p>
          </form>
        )}
      </section>

      <button
        onClick={() => void logout()}
        className="text-xs font-semibold text-red-500 hover:underline"
      >
        Sign out of this account
      </button>
    </div>
  );
}
