import { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import FileExplorer from "./FileExplorer";
import CodeViewer from "./CodeViewer";
import { api } from "@/services/api";
import { Sparkles } from "lucide-react";

const SIZES = {
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "820px", height: "1100px" },
  mobile: { width: "390px", height: "780px" },
};

export default function Preview({ projectName, refreshKey }) {
  const [view, setView] = useState("desktop");
  const [cacheBust, setCacheBust] = useState(0);
  const [openFile, setOpenFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [tree, setTree] = useState([]);
  const iframeRef = useRef(null);
  const wrapRef = useRef(null);

  const url = projectName
    ? `${api.previewUrl(projectName)}?t=${refreshKey}-${cacheBust}`
    : "";

  useEffect(() => {
    setCacheBust((v) => v + 1);
  }, [projectName, refreshKey]);

  useEffect(() => {
    if (!projectName) {
      setTree([]);
      return;
    }

    const loadTree = async () => {
      try {
        const data = await api.listFiles(projectName);
        const items = Array.isArray(data?.files) ? data.files : [];
        const treeNodes = buildTree(items);
        setTree(treeNodes);
      } catch {
        setTree([]);
      }
    };

    loadTree();
  }, [projectName, refreshKey]);

  const buildTree = (items = []) => {
    const root = [];

    const findOrCreateFolder = (parent, name) => {
      let node = parent.find((item) => item.name === name && item.type === "folder");
      if (!node) {
        node = { name, type: "folder", children: [] };
        parent.push(node);
      }
      return node;
    };

    items.forEach((item) => {
      const parts = item.path.split("/").filter(Boolean);
      let parent = root;
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        if (isLast) {
          parent.push({
            name: part,
            type: item.type === "directory" ? "folder" : "file",
          });
          return;
        }
        parent = findOrCreateFolder(parent, part).children;
      });
    });

    return root;
  };

  const openFileInViewer = async (path) => {
    if (!projectName) return;
    setOpenFile(path);
    setFileContent("Loading...");
    try {
      const data = await api.getFileContent(projectName, path);
      setFileContent(data.content ?? "");
    } catch (e) {
      setFileContent(`/* Failed to load: ${e.message} */`);
    }
  };

  return (
    <div ref={wrapRef} className="relative flex flex-col h-full glass-panel overflow-hidden">
      <Toolbar
        view={view}
        setView={setView}
        onRefresh={() => setCacheBust((v) => v + 1)}
        onOpenNewTab={() => url && window.open(url, "_blank")}
        onFullscreen={() => wrapRef.current?.requestFullscreen?.()}
        url={url}
      />
      <div className="flex-1 overflow-auto bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] p-4 grid place-items-center">
        {!projectName ? (
          <div className="text-center text-muted-foreground animate-fade-in">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <div className="text-sm font-medium">No project selected</div>
            <div className="text-xs mt-1">Send a prompt to generate your first website.</div>
          </div>
        ) : (
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 max-w-full max-h-full"
            style={SIZES[view]}
          >
            <iframe
              ref={iframeRef}
              key={url}
              src={url}
              title="preview"
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>
      <FileExplorer tree={tree} onOpen={openFileInViewer} />
      {openFile && (
        <CodeViewer file={openFile} content={fileContent} onClose={() => setOpenFile(null)} />
      )}
    </div>
  );
}
