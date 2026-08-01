from __future__ import annotations

import os
import subprocess
import time
import traceback
from pathlib import Path

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS

from agent.tools import set_project_root
from backend import storage


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    storage.ensure_storage()

    @app.errorhandler(Exception)
    def handle_error(error: Exception):
        status = 404 if isinstance(error, (KeyError, FileNotFoundError)) else 500
        return jsonify({"error": str(error), "trace": traceback.format_exc() if app.debug else None}), status

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "model": os.getenv("CODEMATE_MODEL", "openai/gpt-oss-120b"),
            "aiConfigured": bool(os.getenv("GROQ_API_KEY")),
        })

    @app.get("/api/projects")
    def projects():
        query = request.args.get("q", "").lower()
        items = storage.list_projects()
        if query:
            items = [item for item in items if query in item["name"].lower() or query in item["path"].lower()]
        return jsonify({"projects": items})

    @app.post("/api/projects")
    def create_project():
        data = request.get_json(force=True) or {}
        project = storage.create_project(data.get("name") or "Untitled Project", data.get("template", "blank"))
        return jsonify({"project": project}), 201

    @app.get("/api/projects/<project_id>")
    def get_project(project_id: str):
        return jsonify({"project": storage.touch_project(project_id), "memory": storage.read_memory(project_id)})

    @app.patch("/api/projects/<project_id>")
    def update_project(project_id: str):
        return jsonify({"project": storage.update_project(project_id, request.get_json(force=True) or {})})

    @app.delete("/api/projects/<project_id>")
    def delete_project(project_id: str):
        storage.delete_project(project_id)
        return jsonify({"ok": True})

    @app.post("/api/projects/<project_id>/duplicate")
    def duplicate_project(project_id: str):
        data = request.get_json(force=True) or {}
        return jsonify({"project": storage.duplicate_project(project_id, data.get("name"))}), 201

    @app.get("/api/projects/<project_id>/export")
    def export_project(project_id: str):
        archive = storage.export_zip(project_id)
        return send_file(archive, as_attachment=True, download_name=f"{project_id}.zip")

    @app.get("/api/projects/<project_id>/files")
    def files(project_id: str):
        return jsonify({"files": storage.list_tree(project_id)})

    @app.get("/api/projects/<project_id>/preview/")
    @app.get("/api/projects/<project_id>/preview/<path:relative_path>")
    def preview(project_id: str, relative_path: str = "index.html"):
        root = storage.project_paths(project_id).root
        target = storage.safe_child(root, relative_path)
        if target.is_dir():
            target = storage.safe_child(root, f"{relative_path.rstrip('/')}/index.html")
        return send_from_directory(root, target.relative_to(root))

    @app.get("/api/projects/<project_id>/files/content")
    def file_content(project_id: str):
        path = request.args.get("path", "")
        return jsonify({"path": path, "content": storage.read_project_file(project_id, path)})

    @app.put("/api/projects/<project_id>/files/content")
    def save_file(project_id: str):
        data = request.get_json(force=True) or {}
        return jsonify(storage.write_project_file(project_id, data.get("path", ""), data.get("content", "")))

    @app.post("/api/projects/<project_id>/files")
    def create_file(project_id: str):
        data = request.get_json(force=True) or {}
        return jsonify(storage.create_file_entry(project_id, data.get("path", ""), data.get("type", "file"))), 201

    @app.patch("/api/projects/<project_id>/files")
    def rename_file(project_id: str):
        data = request.get_json(force=True) or {}
        return jsonify(storage.rename_entry(project_id, data.get("source", ""), data.get("target", "")))

    @app.delete("/api/projects/<project_id>/files")
    def delete_file(project_id: str):
        storage.remove_entry(project_id, request.args.get("path", ""))
        return jsonify({"ok": True})

    @app.get("/api/projects/<project_id>/memory")
    def memory(project_id: str):
        return jsonify({"memory": storage.read_memory(project_id)})

    @app.put("/api/projects/<project_id>/memory")
    def update_memory(project_id: str):
        data = request.get_json(force=True) or {}
        return jsonify({"memory": storage.save_memory(project_id, data.get("memory", data))})

    @app.get("/api/projects/<project_id>/versions")
    def versions(project_id: str):
        return jsonify({"versions": storage.list_versions(project_id)})

    @app.get("/api/projects/<project_id>/prompts")
    def prompts(project_id: str):
        return jsonify({"prompts": storage.list_prompts(project_id)})

    @app.post("/api/projects/<project_id>/agent/run")
    def run_agent(project_id: str):
        data = request.get_json(force=True) or {}
        prompt = data.get("prompt", "").strip()
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        if not os.getenv("GROQ_API_KEY"):
            storage.record_prompt(project_id, prompt, [], "missing GROQ_API_KEY", 0)
            return jsonify({
                "error": "GROQ_API_KEY is missing. Add it to .env before running AI generation.",
                "modifiedFiles": [],
            }), 400

        start = time.perf_counter()
        before = {item["path"]: item["updatedAt"] for item in storage.list_tree(project_id) if item["type"] == "file"}
        project_root = storage.project_paths(project_id).root
        project_root.mkdir(parents=True, exist_ok=True)
        set_project_root(project_root)
        from agent.graph import agent

        result = agent.invoke({"user_prompt": prompt}, {"recursion_limit": int(data.get("recursionLimit", 100))})
        after = {item["path"]: item["updatedAt"] for item in storage.list_tree(project_id) if item["type"] == "file"}
        modified = sorted(path for path, updated in after.items() if before.get(path) != updated)
        duration_ms = int((time.perf_counter() - start) * 1000)
        summary = f"Agent completed {len(modified)} file update(s)."
        storage.update_memory_from_files(project_id, prompt)
        storage.create_version(project_id, prompt, modified, summary, duration_ms)
        storage.record_prompt(project_id, prompt, modified, "success", duration_ms)
        return jsonify({"result": str(result), "modifiedFiles": modified, "durationMs": duration_ms, "summary": summary})

    @app.post("/api/projects/<project_id>/terminal")
    def terminal(project_id: str):
        data = request.get_json(force=True) or {}
        command = data.get("command", "")
        cwd = storage.safe_child(storage.project_paths(project_id).root, data.get("cwd", "."))
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            shell=True,
            capture_output=True,
            text=True,
            timeout=int(data.get("timeout", 60)),
        )
        return jsonify({
            "code": completed.returncode,
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "cwd": str(Path(cwd)),
        })

    return app


app = create_app()
