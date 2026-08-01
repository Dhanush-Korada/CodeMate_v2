// Central API service. All backend URLs live here.
export const API_BASE = "http://127.0.0.1:5000";

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  chat: (message, projectId) => {
    if (!projectId) throw new Error("Project is required for chat.");
    return req(`/api/projects/${encodeURIComponent(projectId)}/agent/run`, {
      method: "POST",
      body: JSON.stringify({ prompt: message }),
    });
  },
  listProjects: () => req("/api/projects"),
  getProject: (projectId) => req(`/api/projects/${encodeURIComponent(projectId)}`),
  rename: (projectId, newName) =>
    req(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: newName }),
    }),
  remove: (projectId) =>
    req(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }),
  newProject: (name) =>
    req("/api/projects", { method: "POST", body: JSON.stringify({ name }) }),
  previewUrl: (projectId, file = "index.html") =>
    `${API_BASE}/api/projects/${encodeURIComponent(projectId)}/preview/${file}`,
  listFiles: (projectId) =>
    req(`/api/projects/${encodeURIComponent(projectId)}/files`),
  getFileContent: (projectId, path) =>
    req(
      `/api/projects/${encodeURIComponent(projectId)}/files/content?path=${encodeURIComponent(
        path,
      )}`,
    ),
};
