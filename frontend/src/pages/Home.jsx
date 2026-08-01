import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderKanban, MessageSquare, Eye } from "lucide-react";
import Header from "@/components/Header";
import ProjectHistory from "@/components/ProjectHistory";
import Chat from "@/components/Chat";
import Preview from "@/components/Preview";
import { useProjects } from "@/hooks/useProjects";
import { useChat } from "@/hooks/useChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/services/api";

const LS = {
  sidebar: "codemate:sidebar-width",
  active: "codemate:active-project",
  theme: "codemate:theme",
};

export default function Home() {
  const [dark, setDark] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [chatWidth, setChatWidth] = useState(520);
  const [activeProject, setActiveProject] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [mobileTab, setMobileTab] = useState("chat");
  const isMobile = useIsMobile();
  const { projects, loading, refresh, setProjects } = useProjects();
  const chat = useChat(activeProject?.id);

  const activeProjectId = activeProject?.id;

  // hydrate persisted state
  useEffect(() => {
    const t = localStorage.getItem(LS.theme);
    if (t) setDark(t === "dark");
    const sw = Number(localStorage.getItem(LS.sidebar));
    if (sw) setSidebarWidth(sw);
    const a = localStorage.getItem(LS.active);
    if (a) openProject(a);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(LS.theme, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(LS.sidebar, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem(LS.active, activeProjectId);
  }, [activeProjectId]);

  const openProject = useCallback(async (projectId) => {
    setPreviewKey((v) => v + 1);
    try {
      const data = await api.getProject(projectId);
      setActiveProject(data?.project || null);
      chat.setMessages([]);
      if (data?.project?.id) {
        localStorage.setItem(LS.active, data.project.id);
      }
    } catch (e) {
      toast.error("Failed to load project", { description: e.message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat]);

  const onNewProject = async () => {
    const name = prompt("Project name:", `project-${Date.now().toString(36)}`);
    if (!name) return;
    try {
      const data = await api.newProject(name);
      toast.success("Project created");
      refresh();
      setActiveProject(data.project);
      chat.setMessages([]);
      if (data.project?.id) {
        localStorage.setItem(LS.active, data.project.id);
      }
    } catch (e) {
      toast.error("Could not create project", {
        description: e.message,
        action: { label: "Retry", onClick: onNewProject },
      });
    }
  };

  const onRename = async (projectId, newName) => {
    if (!newName || !projectId) return;
    try {
      await api.rename(projectId, newName);
      toast.success("Renamed");
      if (activeProjectId === projectId) {
        setActiveProject((current) => (current ? { ...current, name: newName } : current));
      }
      refresh();
    } catch (e) {
      toast.error("Rename failed", { description: e.message });
    }
  };

  const onDelete = async (projectId) => {
    if (!projectId) return;
    try {
      await api.remove(projectId);
      toast.success("Deleted");
      if (activeProjectId === projectId) {
        setActiveProject(null);
        chat.setMessages([]);
      }
      refresh();
    } catch (e) {
      toast.error("Delete failed", { description: e.message });
    }
  };

  // Wrap chat.send so preview refreshes when generation completes
  const send = async (text) => {
    try {
      if (!activeProjectId) {
        const defaultName = `project-${Date.now().toString(36)}`;
        const data = await api.newProject(defaultName);
        setActiveProject(data.project);
        localStorage.setItem(LS.active, data.project.id);
        refresh();
        chat.setMessages([]);
      }
      await chat.send(text);
      setPreviewKey((v) => v + 1);
      refresh();
    } catch (e) {
      toast.error("Generation failed", {
        description: e.message,
        action: { label: "Retry", onClick: () => send(text) },
      });
    }
  };
  const wrappedChat = { ...chat, send };

  // Resizable panels via mouse drag
  const startDrag = (which) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSidebar = sidebarWidth;
    const startChat = chatWidth;
    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (which === "sidebar") setSidebarWidth(Math.min(480, Math.max(200, startSidebar + dx)));
      if (which === "chat") setChatWidth(Math.min(900, Math.max(360, startChat + dx)));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector('input[placeholder^="Search"]')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        onNewProject();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header
        onNewProject={onNewProject}
        search={search}
        setSearch={setSearch}
        dark={dark}
        toggleDark={() => setDark((d) => !d)}
      />
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden p-2 gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            {mobileTab === "projects" && (
              <ProjectHistory
                projects={projects}
                loading={loading}
                activeProjectId={activeProjectId}
                onOpen={(n) => { openProject(n); setMobileTab("chat"); }}
                onRename={onRename}
                onDelete={onDelete}
                search={search}
              />
            )}
            {mobileTab === "chat" && (
              <Chat chat={wrappedChat} projectName={activeProject?.name} />
            )}
            {mobileTab === "preview" && (
              <Preview projectName={activeProject?.id} refreshKey={previewKey} />
            )}
          </div>
          <nav className="glass-panel grid grid-cols-3 gap-1 p-1 shrink-0">
            {[
              { id: "projects", label: "Projects", Icon: FolderKanban },
              { id: "chat", label: "Chat", Icon: MessageSquare },
              { id: "preview", label: "Preview", Icon: Eye },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  mobileTab === id ? "bg-secondary text-brand" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden p-2 gap-0 min-h-0">
          <div style={{ width: sidebarWidth }} className="shrink-0 min-w-0 hidden lg:block">
            <ProjectHistory
              projects={projects}
              loading={loading}
              activeProjectId={activeProjectId}
              onOpen={openProject}
              onRename={onRename}
              onDelete={onDelete}
              search={search}
            />
          </div>
          <div onMouseDown={startDrag("sidebar")} className="resizer hidden lg:block" />
          <div style={{ width: chatWidth }} className="shrink-0 min-w-0">
            <Chat chat={wrappedChat} projectName={activeProject?.name} />
          </div>
          <div onMouseDown={startDrag("chat")} className="resizer" />
          <div className="flex-1 min-w-0">
            <Preview projectName={activeProject?.id} refreshKey={previewKey} />
          </div>
        </div>
      )}
    </div>
  );
}
