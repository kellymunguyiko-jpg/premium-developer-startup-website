import { Ban, LogOut, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function BlockedPage() {
  const { profile, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-600 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Ban className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-red-700">
          Account Blocked
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your DevSpace Pro account has been blocked by an administrator.
        </p>
        {profile?.blockedReason && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            Reason: {profile.blockedReason}
          </p>
        )}
        <div className="mt-6 space-y-2 text-left text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            You cannot use the platform while blocked.
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-red-500" />
            Contact support: kellymunguyiko@gmail.com
          </p>
        </div>
        <button
          onClick={() => void logout()}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
