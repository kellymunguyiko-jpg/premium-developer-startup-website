import { useEffect, useState } from "react";
import { Loader2, Play, X } from "lucide-react";
import { fetchVideos, toEmbedUrl } from "../services/videos";
import type { VideoItem } from "../types/notifications";

export function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<VideoItem | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setVideos(await fetchVideos());
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Videos
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Learning videos uploaded by admin
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => (
            <article
              key={v.id}
              className="overflow-hidden rounded-2xl border border-green-50 bg-white shadow-sm dark:border-green-900/40 dark:bg-[#111814]"
            >
              <button
                onClick={() => setPlayer(v)}
                className="group relative block w-full overflow-hidden"
              >
                <img
                  src={v.image}
                  alt={v.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                </div>
              </button>
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {v.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {v.about}
                </p>
              </div>
            </article>
          ))}
          {videos.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-slate-400">
              No videos yet. Admin can upload from Admin panel.
            </p>
          )}
        </div>
      )}

      {player && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/70 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between bg-[#0d1210] px-4">
            <p className="truncate text-sm font-bold text-white">
              {player.title}
            </p>
            <button
              onClick={() => setPlayer(null)}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            <iframe
              title={player.title}
              src={toEmbedUrl(player.videoUrl)}
              className="aspect-video w-full max-w-5xl rounded-xl border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
