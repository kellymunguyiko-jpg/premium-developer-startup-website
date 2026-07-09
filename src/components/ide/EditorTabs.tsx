import { X, Circle } from "lucide-react";
import { cn } from "../../utils/cn";
import type { FileNode } from "../../data/ideFiles";

interface EditorTabsProps {
  openFiles: FileNode[];
  activeFileId: string | null;
  dirtyIds: Set<string>;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function EditorTabs({
  openFiles,
  activeFileId,
  dirtyIds,
  onSelect,
  onClose,
}: EditorTabsProps) {
  if (openFiles.length === 0) return null;

  return (
    <div className="flex items-center gap-0 overflow-x-auto border-b border-green-100 bg-[#f8faf8] dark:border-green-900/40 dark:bg-[#0a0f0c]">
      {openFiles.map((file) => {
        const isActive = file.id === activeFileId;
        const isDirty = dirtyIds.has(file.id);
        return (
          <button
            key={file.id}
            onClick={() => onSelect(file.id)}
            className={cn(
              "group flex shrink-0 items-center gap-2 border-r border-green-50 px-3 py-2 text-[12px] transition-colors dark:border-green-900/30",
              isActive
                ? "border-b-2 border-b-green-600 bg-white font-medium text-green-800 dark:bg-[#111814] dark:text-green-300"
                : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-500 dark:hover:bg-[#111814] dark:hover:text-slate-300"
            )}
          >
            {isDirty && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <span className="max-w-[120px] truncate">{file.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onClose(file.id);
                }
              }}
              className={cn(
                "rounded p-0.5 transition-colors",
                isActive
                  ? "text-slate-400 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-400"
                  : "text-transparent group-hover:text-slate-400 hover:!bg-green-50 hover:!text-green-700 dark:hover:!bg-green-950 dark:hover:!text-green-400"
              )}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
