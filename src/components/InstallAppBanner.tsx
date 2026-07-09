import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

/**
 * Easy install UI:
 * - When Chrome is ready, shows a clear Install App card
 * - Chrome also shows its own install icon in the address bar (monitor/↓)
 */
export function InstallAppBanner() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("devspace-hide-install") === "1") {
      setHidden(true);
    }
  }, []);

  if (isInstalled || hidden || !canInstall) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-green-200 bg-white p-3 shadow-2xl shadow-green-900/20 dark:border-green-800 dark:bg-[#111814]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
          <MonitorSmartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Install DevSpace App
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Or use the install icon in Chrome address bar (computer ↓)
          </p>
        </div>
        <button
          onClick={() => {
            void (async () => {
              setBusy(true);
              await install();
              setBusy(false);
            })();
          }}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {busy ? "..." : "Install"}
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem("devspace-hide-install", "1");
            setHidden(true);
          }}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-slate-600 dark:hover:bg-green-950"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
