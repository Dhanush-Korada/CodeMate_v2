import { Search, Plus, Settings, Sun, Moon, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header({ onNewProject, search, setSearch, dark, toggleDark }) {
  return (
    <header className="glass-panel flex items-center gap-2 sm:gap-3 px-2 sm:px-4 h-14 border-b border-border/60 z-20">
      <div className="flex items-center gap-2 pr-1 sm:pr-2 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight text-sm hidden sm:inline">
          CODE<span className="text-brand">MATE</span>
        </span>
      </div>
      <div className="relative flex-1 min-w-0 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="pl-9 h-9 bg-secondary/40 border-border/60"
        />
      </div>
      <Button onClick={onNewProject} size="sm" className="gap-2 bg-gradient-brand text-primary-foreground border-0 shadow-glow hover:opacity-90 shrink-0">
        <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Project</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle theme" className="shrink-0">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" title="Settings" className="hidden md:inline-flex shrink-0">
        <Settings className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Profile" className="hidden md:inline-flex shrink-0">
        <User className="h-4 w-4" />
      </Button>
    </header>
  );
}
