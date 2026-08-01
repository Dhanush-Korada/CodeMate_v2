import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import PromptInput from "./PromptInput";
import { Sparkles, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Create a modern ecommerce website",
  "Build a portfolio for a photographer",
  "Design a SaaS landing page with pricing",
  "Make a blog with dark mode",
];

export default function Chat({ chat, projectName }) {
  const { messages, loading, loadingStep, send, stop, regenerate } = chat;
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loadingStep]);

  return (
    <div className="flex flex-col h-full glass-panel border-x border-border/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <div className="text-sm font-medium">AI Chat</div>
        {projectName && (
          <span className="ml-auto text-xs text-muted-foreground truncate">{projectName}</span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-4">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-1">What should we build today?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Describe your idea and I'll generate a working website.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm p-3 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 hover:border-brand/40 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-lg shrink-0 grid place-items-center bg-gradient-brand shadow-glow">
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1.5">
              <span className="animate-pulse-soft">{loadingStep || "Working..."}</span>
              <span className="loading-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <PromptInput
        onSend={send}
        loading={loading}
        onStop={stop}
        onRegenerate={regenerate}
        canRegenerate={messages.some((m) => m.role === "assistant")}
      />
    </div>
  );
}
