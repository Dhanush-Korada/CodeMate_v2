import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listProjects();
      const list = Array.isArray(data) ? data : data.projects || [];
      setProjects(list);
    } catch (e) {
      setError(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { projects, loading, error, refresh, setProjects };
}
