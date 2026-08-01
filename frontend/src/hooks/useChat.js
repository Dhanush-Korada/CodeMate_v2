import { useCallback, useRef, useState } from "react";
import { api } from "@/services/api";

const LOADING_STEPS = [
  "Thinking...",
  "Planning...",
  "Generating HTML...",
  "Writing CSS...",
  "Writing JavaScript...",
  "Saving Files...",
  "Finalizing...",
];

export function useChat(projectName) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const abortRef = useRef({ aborted: false });
  const stepTimer = useRef(null);

  const startStepAnimation = () => {
    let i = 0;
    setLoadingStep(LOADING_STEPS[0]);
    stepTimer.current = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length;
      setLoadingStep(LOADING_STEPS[i]);
    }, 1400);
  };
  const stopStepAnimation = () => {
    if (stepTimer.current) clearInterval(stepTimer.current);
    stepTimer.current = null;
    setLoadingStep("");
  };

  const send = useCallback(
    async (text, { replaceLastAI = false } = {}) => {
      if (!text?.trim()) return;
      abortRef.current = { aborted: false };
      const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((m) => (replaceLastAI ? [...m] : [...m, userMsg]));
      setLoading(true);
      startStepAnimation();
      try {
        const res = await api.chat(text, projectName);
        if (abortRef.current.aborted) return;
        const content =
          typeof res === "string"
            ? res
            : res.result || res.reply || res.response || res.message || JSON.stringify(res, null, 2);
        const aiMsg = { id: crypto.randomUUID(), role: "assistant", content, meta: res };
        setMessages((m) => {
          if (replaceLastAI) {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === "assistant") {
                copy[i] = aiMsg;
                return copy;
              }
            }
            return [...copy, aiMsg];
          }
          return [...m, aiMsg];
        });
        return res;
      } catch (e) {
        if (abortRef.current.aborted) return;
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            error: true,
            content: e.message || "Something went wrong.",
          },
        ]);
        throw e;
      } finally {
        stopStepAnimation();
        setLoading(false);
      }
    },
    [projectName],
  );

  const stop = () => {
    abortRef.current.aborted = true;
    stopStepAnimation();
    setLoading(false);
  };

  const regenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) return send(lastUser.content, { replaceLastAI: true });
  }, [messages, send]);

  return { messages, setMessages, loading, loadingStep, send, stop, regenerate };
}
