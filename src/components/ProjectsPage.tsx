import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Cloud,
  CloudOff,
  Crown,
  FolderKanban,
  HardDrive,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";

const PRO_PRICE = 5;
const PRO_DAYS = 30;
const PRO_KEY = (uid: string) => `devspace-pro-${uid}`;

function loadPro(uid: string): { active: boolean; until: number } {
  try {
    const raw = localStorage.getItem(PRO_KEY(uid));
    if (!raw) return { active: false, until: 0 };
    const data = JSON.parse(raw) as { until: number };
    return { active: data.until > Date.now(), until: data.until };
  } catch {
    return { active: false, until: 0 };
  }
}

export function ProjectsPage() {
  const { profile } = useAuth();
  const [proUntil, setProUntil] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const p = loadPro(profile.uid);
    setProUntil(p.until);
  }, [profile?.uid]);

  const whatsappNumber =
    (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ||
    "250780000000";

  const payLink = useMemo(() => {
    if (!profile) return "#";
    const msg = encodeURIComponent(
      `Hello Admin, I want to Upgrade to Pro on DevSpace.\n\nName: ${profile.displayName}\nEmail: ${profile.email || "-"}\nUID: ${profile.uid}\nPlan: $${PRO_PRICE} / ${PRO_DAYS} days\n\nI will pay via WhatsApp and send payment proof.`
    );
    const phone = whatsappNumber.replace(/[^\d]/g, "");
    return `https://wa.me/${phone}?text=${msg}`;
  }, [profile, whatsappNumber]);

  if (!profile) return null;

  const isPro = proUntil > Date.now();
  const projects = profile.stats?.totalProjects || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          <FolderKanban className="h-6 w-6 text-green-600" />
          Projects
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Store projects in the cloud & backup your code with Pro
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
          <p className="text-[11px] text-slate-400">Saved projects</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {projects}
          </p>
        </div>
        <div className="rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
          <p className="text-[11px] text-slate-400">Followers</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {profile.followerIds?.length || profile.stats.followers || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-green-50 bg-white p-4 dark:border-green-900/40 dark:bg-[#111814]">
          <p className="text-[11px] text-slate-400">Cloud backup</p>
          <p className="flex items-center gap-1 text-lg font-black text-slate-900 dark:text-white">
            {isPro ? (
              <>
                <Cloud className="h-5 w-5 text-green-600" /> Pro active
              </>
            ) : (
              <>
                <CloudOff className="h-5 w-5 text-slate-400" /> Free local
              </>
            )}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-3xl border shadow-sm",
          isPro
            ? "border-green-200 bg-gradient-to-br from-green-50 to-white dark:border-green-800 dark:from-green-950/40 dark:to-[#111814]"
            : "border-green-50 bg-white dark:border-green-900/40 dark:bg-[#111814]"
        )}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 text-[11px] font-bold text-white">
                <Crown className="h-3.5 w-3.5" />
                Upgrade to Pro
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                ${PRO_PRICE}
                <span className="text-base font-semibold text-slate-400">
                  {" "}
                  / {PRO_DAYS} days
                </span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Pay via WhatsApp to unlock cloud project storage and automatic
                code backup.
              </p>
            </div>
            <div className="rounded-2xl bg-green-600/10 px-4 py-3 text-center dark:bg-green-900/30">
              <HardDrive className="mx-auto h-6 w-6 text-green-600" />
              <p className="mt-1 text-xs font-bold text-green-700 dark:text-green-400">
                Cloud + Backup
              </p>
            </div>
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {[
              "Cloud project storage",
              "Automatic code backups",
              "Restore any saved version",
              "Priority project sync",
              "Pro badge on profile",
              "Support via WhatsApp",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <Check className="h-4 w-4 shrink-0 text-green-600" />
                {f}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-white/70 px-4 py-3 dark:border-green-800 dark:bg-green-950/20">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  Pro is active
                </p>
                <p className="text-xs text-slate-500">
                  Until{" "}
                  {new Date(proUntil).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <a
                href={payLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-95"
              >
                <MessageCircle className="h-4 w-4" />
                Pay on WhatsApp — ${PRO_PRICE} / {PRO_DAYS} days
              </a>
              <p className="text-xs text-slate-500">
                WhatsApp:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  +{whatsappNumber.replace(/[^\d]/g, "")}
                </span>
                . Send payment proof with your email. Admin will activate Pro.
              </p>
              <p className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400">
                <Sparkles className="h-3.5 w-3.5" />
                After payment, keep your chat open for activation confirmation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
