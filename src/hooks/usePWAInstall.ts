import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Keep a module-level deferred prompt so Chrome install flow stays available
// across remounts, and so we don't lose the event.
let globalDeferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Keep default Chrome address-bar install icon available,
    // but also capture the event for our Install button.
    e.preventDefault();
    globalDeferred = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    globalDeferred = null;
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

export function usePWAInstall() {
  const [tick, setTick] = useState(0);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandalone());
    const onChange = () => setTick((t) => t + 1);
    listeners.add(onChange);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setIsInstalled(isStandalone());
    mq.addEventListener?.("change", onMq);
    return () => {
      listeners.delete(onChange);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  const canInstall = Boolean(globalDeferred) && !isInstalled && !isStandalone();

  const install = useCallback(async () => {
    if (!globalDeferred) return false;
    try {
      await globalDeferred.prompt();
      const choice = await globalDeferred.userChoice;
      globalDeferred = null;
      notify();
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [tick]);

  const clearCache = useCallback(async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage("CLEAR_CACHE");
    }
  }, []);

  const updateApp = useCallback(async () => {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
    reg?.waiting?.postMessage("SKIP_WAITING");
    window.location.reload();
  }, []);

  return {
    canInstall,
    isInstalled: isInstalled || isStandalone(),
    install,
    clearCache,
    updateApp,
    hasPrompt: Boolean(globalDeferred),
  };
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const register = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      // Ensure SW controls page ASAP (needed for installability)
      await navigator.serviceWorker.ready;
      if (reg.waiting) {
        reg.waiting.postMessage("SKIP_WAITING");
      }
      // Check for updates periodically
      setInterval(() => {
        void reg.update();
      }, 60 * 60 * 1000);
    } catch (err) {
      console.warn("SW registration failed", err);
    }
  };

  if (document.readyState === "complete") {
    void register();
  } else {
    window.addEventListener("load", () => void register());
  }
}
