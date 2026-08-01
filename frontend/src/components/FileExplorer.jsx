import { useState } from "react";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react";

const DEFAULT_TREE = [
  { name: "index.html", type: "file" },
  { name: "style.css", type: "file" },
  { name: "script.js", type: "file" },
  { name: "assets", type: "folder", children: [] },
  { name: "images", type: "folder", children: [] },
];

function Node({ node, depth = 0, onOpen, parentPath = "" }) {
  const [open, setOpen] = useState(depth === 0);
  const path = parentPath ? `${parentPath}/${node.name}` : node.name;
  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ paddingLeft: depth * 12 + 8 }}
          className="flex items-center gap-1.5 w-full py-1 text-xs hover:bg-secondary/60 rounded"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-brand" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-brand" />
          )}
          <span>{node.name}</span>
        </button>
        {open &&
          (node.children?.length ? (
            node.children.map((c) => (
              <Node key={c.name} node={c} depth={depth + 1} onOpen={onOpen} parentPath={path} />
            ))
          ) : (
            <div style={{ paddingLeft: (depth + 1) * 12 + 8 }} className="text-[11px] text-muted-foreground py-1">
              empty
            </div>
          ))}
      </div>
    );
  }
  return (
    <button
      onClick={() => onOpen(path)}
      style={{ paddingLeft: depth * 12 + 22 }}
      className="flex items-center gap-1.5 w-full py-1 text-xs hover:bg-secondary/60 rounded"
    >
      <File className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{node.name}</span>
    </button>
  );
}

export default function FileExplorer({ tree = DEFAULT_TREE, onOpen }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border-t border-border/60 bg-secondary/20">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-secondary/40"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <FolderOpen className="h-3.5 w-3.5 text-brand" />
        File Explorer
      </button>
      {expanded && (
        <div className="px-2 pb-2 max-h-56 overflow-auto scroll-thin">
          {tree.map((n) => (
            <Node key={n.name} node={n} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
