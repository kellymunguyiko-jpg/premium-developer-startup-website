import { ArrowRight, MoreHorizontal } from "lucide-react";
import { communityFeed } from "../data/dashboard";
import { useState } from "react";
import { cn } from "../utils/cn";

const tabs = ["All", "Questions", "Projects", "Articles"] as const;

export function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");

  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            Community Feed
          </h2>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-all",
                activeTab === tab
                  ? "bg-green-600 text-white shadow-sm shadow-green-200 dark:shadow-green-900/30"
                  : "bg-green-50 text-slate-500 hover:bg-green-100 hover:text-green-700 dark:bg-green-950/50 dark:text-slate-400 dark:hover:bg-green-900/40 dark:hover:text-green-400"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        {communityFeed.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-green-50 bg-green-50/20 p-4 transition-all hover:border-green-100 hover:bg-white hover:shadow-sm dark:border-green-900/30 dark:bg-green-950/20 dark:hover:border-green-800 dark:hover:bg-[#0d1210]"
          >
            <div className="flex gap-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="h-9 w-9 shrink-0 rounded-full bg-green-100 dark:bg-green-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {post.author}
                      </span>{" "}
                      {post.action}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {post.time} • {post.tags}
                    </p>
                  </div>
                  <button className="rounded-lg p-1 text-slate-300 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className={cn("mt-3", post.preview && "flex gap-4")}>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {post.description}
                    </p>
                  </div>
                  {post.preview && (
                    <div className="mt-3 hidden shrink-0 overflow-hidden rounded-xl border border-green-100 dark:border-green-900/40 sm:mt-0 sm:block">
                      <img
                        src={post.preview}
                        alt="Project preview"
                        className="h-20 w-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
