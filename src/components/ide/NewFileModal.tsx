import { useState } from "react";
import { X, FilePlus } from "lucide-react";
import { languageOptions, languageTemplates } from "../../data/ideFiles";
import { cn } from "../../utils/cn";

interface NewFileModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, language: string, content: string) => void;
}

export function NewFileModal({ open, onClose, onCreate }: NewFileModalProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("javascript");

  if (!open) return null;

  const selected = languageOptions.find((l) => l.id === language);

  const handleCreate = () => {
    let filename = name.trim();
    if (!filename) {
      filename = `untitled.${selected?.ext ?? "txt"}`;
    } else if (!filename.includes(".") && selected) {
      filename = `${filename}.${selected.ext}`;
    }
    const content = languageTemplates[language] ?? `// ${filename}\n`;
    onCreate(filename, language, content);
    setName("");
    setLanguage("javascript");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-green-100 bg-white p-6 shadow-2xl shadow-green-900/10 dark:border-green-900/50 dark:bg-[#111814] dark:shadow-black/40">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
              <FilePlus className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              New File
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
          File name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`untitled.${selected?.ext ?? "js"}`}
          className="mb-4 h-10 w-full rounded-xl border border-green-100 bg-green-50/30 px-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-slate-200 dark:focus:border-green-700 dark:focus:bg-[#0d1210] dark:focus:ring-green-900/40"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
          Language
        </label>
        <div className="mb-5 grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">
          {languageOptions.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={cn(
                "rounded-lg px-2 py-2 text-[11px] font-semibold transition-all",
                language === lang.id
                  ? "bg-green-600 text-white shadow-sm shadow-green-200 dark:shadow-green-900/30"
                  : "bg-green-50/60 text-slate-600 hover:bg-green-100 hover:text-green-700 dark:bg-green-950/40 dark:text-slate-400 dark:hover:bg-green-900/40 dark:hover:text-green-300"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-green-100 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-green-50 dark:border-green-900/50 dark:text-slate-400 dark:hover:bg-green-950"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 active:scale-[0.98] dark:shadow-green-900/30"
          >
            Create File
          </button>
        </div>
      </div>
    </div>
  );
}
