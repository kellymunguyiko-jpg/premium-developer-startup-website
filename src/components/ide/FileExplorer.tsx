import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  FileJson,
  FileText,
  FileType,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { cn } from "../../utils/cn";
import type { FileNode } from "../../data/ideFiles";

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "json") return FileJson;
  if (ext === "md" || ext === "txt") return FileText;
  if (ext === "html" || ext === "css") return FileType;
  return FileCode;
}

function getFileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    js: "text-yellow-500",
    jsx: "text-yellow-500",
    ts: "text-blue-500",
    tsx: "text-blue-500",
    py: "text-green-500",
    java: "text-orange-500",
    cpp: "text-blue-400",
    c: "text-blue-300",
    go: "text-cyan-400",
    rs: "text-orange-400",
    html: "text-orange-400",
    css: "text-sky-400",
    json: "text-yellow-400",
    md: "text-slate-400",
    sql: "text-green-400",
    yml: "text-pink-400",
    yaml: "text-pink-400",
    php: "text-purple-400",
    rb: "text-red-400",
    sh: "text-green-500",
  };
  return colors[ext ?? ""] ?? "text-green-500";
}

interface TreeItemProps {
  node: FileNode;
  depth: number;
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  filter: string;
}

function TreeItem({
  node,
  depth,
  activeFileId,
  onSelect,
  onDelete,
  filter,
}: TreeItemProps) {
  const [open, setOpen] = useState(true);
  const isFolder = node.type === "folder";
  const isActive = activeFileId === node.id;
  const FileIcon = isFolder ? null : getFileIcon(node.name);

  if (
    filter &&
    !isFolder &&
    !node.name.toLowerCase().includes(filter.toLowerCase())
  ) {
    return null;
  }

  if (isFolder && filter && node.children) {
    const hasMatch = (nodes: FileNode[]): boolean =>
      nodes.some(
        (n) =>
          (n.type === "file" &&
            n.name.toLowerCase().includes(filter.toLowerCase())) ||
          (n.children && hasMatch(n.children))
      );
    if (!hasMatch(node.children)) return null;
  }

  return (
    <div>
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-1 rounded-md py-1 pr-2 text-[12.5px] transition-colors",
          isActive
            ? "bg-green-100 font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300"
            : "text-slate-600 hover:bg-green-50 hover:text-green-700 dark:text-slate-400 dark:hover:bg-green-950/60 dark:hover:text-green-300"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) setOpen((v) => !v);
          else onSelect(node.id);
        }}
      >
        {isFolder ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {isFolder ? (
          open ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-green-500" />
          )
        ) : (
          FileIcon && (
            <FileIcon
              className={cn("h-4 w-4 shrink-0", getFileColor(node.name))}
            />
          )
        )}

        <span className="min-w-0 flex-1 truncate">{node.name}</span>

        {!isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="hidden rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 group-hover:block dark:hover:bg-red-950/40"
            title="Delete file"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {isFolder && open && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onSelect={onSelect}
              onDelete={onDelete}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  tree: FileNode[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onNewFile: () => void;
  onDelete: (id: string) => void;
}

export function FileExplorer({
  tree,
  activeFileId,
  onSelect,
  onNewFile,
  onDelete,
}: FileExplorerProps) {
  const [filter, setFilter] = useState("");

  return (
    <div className="flex h-full flex-col border-r border-green-100 bg-white dark:border-green-900/40 dark:bg-[#0d1210]">
      <div className="flex items-center justify-between border-b border-green-50 px-3 py-2.5 dark:border-green-900/40">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Explorer
        </span>
        <button
          onClick={onNewFile}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
          title="New File"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-green-50 px-2 py-2 dark:border-green-900/40">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files..."
            className="h-7 w-full rounded-md border border-green-100 bg-green-50/40 pl-7 pr-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-green-300 dark:border-green-900/50 dark:bg-green-950/30 dark:text-slate-300 dark:placeholder:text-slate-600 dark:focus:border-green-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        <div className="mb-1 px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Online Workspace
          </span>
        </div>
        {tree.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            depth={0}
            activeFileId={activeFileId}
            onSelect={onSelect}
            onDelete={onDelete}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}
