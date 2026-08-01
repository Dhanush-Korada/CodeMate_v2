import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Sparkles, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");
  if (inline) {
    return (
      <code className="rounded px-1.5 py-0.5 bg-secondary text-[0.85em] font-mono" {...props}>
        {children}
      </code>
    );
  }
  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border/60 bg-[#1e1e2e]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-border/60 text-xs text-muted-foreground">
        <span>{match?.[1] || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={match?.[1] || "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "12.5px" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const isError = message.error;

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 rounded-lg shrink-0 grid place-items-center ${
          isUser
            ? "bg-secondary text-foreground"
            : isError
              ? "bg-destructive/20 text-destructive"
              : "bg-gradient-brand text-primary-foreground shadow-glow"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
        {isUser ? (
          <div className="inline-block rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div
            className={`prose-chat text-sm leading-relaxed ${
              isError ? "text-destructive" : "text-foreground"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ code: CodeBlock }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
