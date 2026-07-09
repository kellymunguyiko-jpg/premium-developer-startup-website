import {
  Braces,
  Cloud,
  Regex,
  AlignLeft,
  Droplet,
  FileText,
  QrCode,
  Eraser,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const tools: { id: string; name: string; icon: LucideIcon }[] = [
  { id: "json", name: "JSON Formatter", icon: Braces },
  { id: "api", name: "API Tester", icon: Cloud },
  { id: "regex", name: "Regex Tester", icon: Regex },
  { id: "format", name: "Code Formatter", icon: AlignLeft },
  { id: "color", name: "Color Picker", icon: Droplet },
  { id: "markdown", name: "Markdown Editor", icon: FileText },
  { id: "qr", name: "QR Generator", icon: QrCode },
  { id: "removebg", name: "BG Remover", icon: Eraser },
];

export function DeveloperTools({
  onOpenTools,
}: {
  onOpenTools?: (toolId?: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-green-50 bg-white p-5 shadow-sm dark:border-green-900/40 dark:bg-[#111814]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Developer Tools
        </h2>
        <button
          onClick={() => onOpenTools?.()}
          className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onOpenTools?.(tool.id)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-green-50 bg-green-50/20 p-3.5 transition-all duration-200 hover:border-green-200 hover:bg-white hover:shadow-md hover:shadow-green-100/40 dark:border-green-900/30 dark:bg-green-950/20 dark:hover:border-green-800 dark:hover:bg-[#0d1210] dark:hover:shadow-green-900/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white dark:bg-green-950 dark:text-green-400">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <span className="text-center text-[11px] font-semibold text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200">
                {tool.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
