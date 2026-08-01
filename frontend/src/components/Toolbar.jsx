import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

export default function Toolbar({ view, setView, onRefresh, onOpenNewTab, onFullscreen, url }) {
  return (
    <div className="flex items-center gap-1 px-3 h-11 border-b border-border/60 bg-secondary/20 ">
      <div className="flex items-center rounded-lg bg-secondary/60 p-0.5">
        {VIEWS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={label}
            className={`p-1.5 rounded-md transition-all ${
              view === id ? "bg-background shadow text-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div className="flex-1 mx-2">
      <div className="text-[11px] font-mono text-muted-foreground truncate bg-background/60 rounded px-2 py-1 border border-border/60 max-w-[220px]">
  {url
    ? url.length > 40
      ? `${url.slice(0, 30)}...`
      : url
    : "no preview"}
</div>
      </div>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRefresh} title="Refresh">
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onOpenNewTab} title="Open in new tab">
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onFullscreen} title="Fullscreen">
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
