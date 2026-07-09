import { Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getFollowersCount, getFollowingCount } from "../types/user";

export function ProfileCard({ onViewProfile }: { onViewProfile?: () => void }) {
  const { profile } = useAuth();
  if (!profile) return null;

  const avatar =
    profile.photoURL ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.uid}&backgroundColor=bbf7d0`;

  const followers = getFollowersCount(profile);
  const following = getFollowingCount(profile);

  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <img
            src={avatar}
            alt={profile.displayName}
            className="h-20 w-20 rounded-full bg-green-100 ring-4 ring-green-50 dark:bg-green-900 dark:ring-green-900/50"
          />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-[#111814]" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
          {profile.displayName}
        </h3>
        <p className="text-xs text-slate-400">{profile.role}</p>

        <div className="mt-4 w-full">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Profile Completion
            </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {profile.profileCompletion}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600"
              style={{ width: `${profile.profileCompletion}%` }}
            />
          </div>
        </div>

        <button
          onClick={onViewProfile}
          className="mt-4 w-full rounded-xl border-2 border-green-600 py-2.5 text-xs font-bold text-green-700 transition-all hover:bg-green-600 hover:text-white active:scale-[0.98] dark:text-green-400 dark:hover:bg-green-600 dark:hover:text-white"
        >
          View Profile
        </button>

        <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-green-50 pt-4 dark:border-green-900/40">
          <div>
            <p className="text-base font-bold tabular-nums text-slate-900 transition-all dark:text-white">
              {followers}
            </p>
            <p className="text-[10px] font-medium text-slate-400">Followers</p>
          </div>
          <div>
            <p className="text-base font-bold tabular-nums text-slate-900 transition-all dark:text-white">
              {following}
            </p>
            <p className="text-[10px] font-medium text-slate-400">Following</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-0.5 text-base font-bold text-green-600 dark:text-green-400">
              {profile.isAdmin ? "Admin" : "Member"}
              <Trophy className="h-3.5 w-3.5" />
            </p>
            <p className="text-[10px] font-medium text-slate-400">Rank</p>
          </div>
        </div>
      </div>
    </section>
  );
}
