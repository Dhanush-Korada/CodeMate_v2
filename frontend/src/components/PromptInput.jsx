import { useRef, useState } from "react";
import { Send, Paperclip, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PromptInput({ onSend, loading, onStop, onRegenerate, canRegenerate }) {
  const [value, setValue] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const submit = () => {
    const t = value.trim();
    if (!t || loading) return;
    onSend(t);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  return (
    <div className="p-4 pt-2">
      {canRegenerate && !loading && (
        <div className="flex justify-center mb-2">
          <Button size="sm" variant="outline" onClick={onRegenerate} className="gap-2 text-xs">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </Button>
        </div>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        className={`glass-panel rounded-2xl border transition-all ${
          drag ? "border-brand ring-2 ring-brand/30" : "border-border/60"
        }`}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Describe the website you want to build..."
          className="w-full resize-none bg-transparent px-4 pt-3 pb-1 outline-none text-sm placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" className="hidden" />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => fileRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary">Enter</kbd> to send ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary">Shift+Enter</kbd> new line
            </span>
            {loading ? (
              <Button size="sm" variant="destructive" onClick={onStop} className="gap-1">
                <Square className="h-3 w-3 fill-current" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={submit}
                disabled={!value.trim()}
                className="gap-1 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
