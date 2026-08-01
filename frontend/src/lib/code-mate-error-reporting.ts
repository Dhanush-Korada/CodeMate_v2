type CodeMateErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type CodeMateEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: CodeMateErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __codemateEvents?: CodeMateEvents;
    __codemateReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportCodeMateError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__codemateEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
  // Prod React does not rethrow boundary-caught errors to window.onerror, so the
  // editor telemetry never sees them. Forward to the CODEMATE runtime reporting hook
  // when it is present in the preview environment.
  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  window.__codemateReportRuntimeError?.({
    message,
    stack: error instanceof Error ? error.stack : undefined,
    filename: window.location.pathname,
  });
}
