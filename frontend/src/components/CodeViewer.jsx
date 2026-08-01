import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANG = { html: "html", css: "css", js: "javascript", json: "json", md: "markdown" };

export default function CodeViewer({ file, content, onClose }) {
  const ext = file?.split(".").pop() || "";
  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 h-11 border-b border-border/60">
        <div className="text-sm font-mono truncate">{file}</div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={LANG[ext] || "text"}
          style={oneDark}
          customStyle={{ margin: 0, background: "transparent", fontSize: 13, minHeight: "100%" }}
          showLineNumbers
        >
          {content || "// File is empty or could not be loaded."}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
