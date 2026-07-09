import { useState } from "react";
import { Code2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function LoginPage() {
  const {
    signInWithGoogle,
    signInWithGithub,
    error,
    clearError,
    loading,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [busy, setBusy] = useState<"google" | "github" | null>(null);

  const run = async (key: "google" | "github", fn: () => Promise<void>) => {
    clearError();
    setBusy(key);
    try {
      await fn();
    } catch {
      /* error via context */
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7faf7] dark:bg-[#0a0f0c]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf7] px-4 py-10 dark:bg-[#0a0f0c]">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/20" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/40">
            <Code2 className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            DevSpace <span className="text-green-600">Pro</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in with Google or GitHub to start coding
          </p>
        </div>

        <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5 dark:border-green-900/40 dark:bg-[#111814] dark:shadow-black/30 sm:p-8">
          <div className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400">
            <Sparkles className="h-3.5 w-3.5" />
            Continue with Google or GitHub
          </div>

          <div className="space-y-3">
            <button
              onClick={() => void run("google", signInWithGoogle)}
              disabled={!!busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-green-100 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-green-300 hover:bg-green-50 disabled:opacity-60 dark:border-green-900/50 dark:bg-[#0d1210] dark:text-slate-200 dark:hover:border-green-700 dark:hover:bg-green-950/40"
            >
              {busy === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => void run("github", signInWithGithub)}
              disabled={!!busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {busy === "github" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GitHubIcon />
              )}
              Continue with GitHub
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm hover:text-green-700 dark:bg-[#111814] dark:text-slate-400 dark:hover:text-green-400"
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-400">
          Admin login is available in Settings after you sign in.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
