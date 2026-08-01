import { useState } from "react";
import { FolderGit2, MoreHorizontal, Pencil, Trash2, ExternalLink, Loader2, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

function formatDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return String(v);
  }
}

export default function ProjectHistory({
  projects,
  loading,
  activeProjectId,
  onOpen,
  onRename,
  onDelete,
  search,
}) {
  const [renameOpen, setRenameOpen] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(null);

  const filtered = projects.filter((p) => {
    const name = p.name || p.projectName || p;
    return String(name).toLowerCase().includes((search || "").toLowerCase());
  });

  return (
    <aside className="glass-panel flex flex-col h-full border-r border-border/60 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/60">
        <FolderGit2 className="h-4 w-4 text-brand" />
        <span className="text-sm font-medium">Projects</span>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scroll-thin">
        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-10 px-4">
            <FileCode className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No projects yet. Create one to get started.
          </div>
        )}
        {filtered.map((p) => {
          const projectId = p.id || p.projectId || String(p);
          const name = p.name || p.projectName || String(p);
          const active = projectId === activeProjectId;
          return (
            <div
              key={projectId}
              onClick={() => onOpen(projectId)}
              className={`group relative rounded-lg px-3 py-2.5 cursor-pointer transition-all border ${
                active
                  ? "bg-brand/10 border-brand/40 shadow-glow"
                  : "border-transparent hover:bg-secondary/50 hover:border-border/60"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{name}</div>
                  <div className="text-[11px] text-muted-foreground flex gap-2 mt-0.5">
                    <span>Created {formatDate(p.createdAt || p.created)}</span>
                    <span>·</span>
                    <span>Modified {formatDate(p.modifiedAt || p.modified || p.updatedAt)}</span>
                  </div>
                  {p.status && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand">
                      {p.status}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onOpen(projectId)}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameVal(name);
                        setRenameOpen(projectId);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteOpen(projectId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!renameOpen} onOpenChange={(o) => !o && setRenameOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename project</AlertDialogTitle>
            <AlertDialogDescription>Choose a new name for this project.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRename(renameOpen, renameVal);
                setRenameOpen(null);
              }}
            >
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{projects.find((p) => p.id === deleteOpen)?.name || deleteOpen}</b>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                onDelete(deleteOpen);
                setDeleteOpen(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
