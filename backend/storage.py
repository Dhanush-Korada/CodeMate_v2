from __future__ import annotations

import json
import shutil
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


APP_ROOT = Path.cwd()
DATA_ROOT = APP_ROOT / ".codemate"
PROJECTS_ROOT = APP_ROOT / "workspace"
INDEX_FILE = DATA_ROOT / "projects.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_storage() -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    if not INDEX_FILE.exists():
        save_json(INDEX_FILE, {"projects": [], "recent": []})


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


def slugify(value: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    return "-".join(part for part in slug.split("-") if part) or "project"


def safe_child(root: Path, relative_path: str = ".") -> Path:
    candidate = (root / relative_path).resolve()
    resolved_root = root.resolve()
    if candidate != resolved_root and resolved_root not in candidate.parents:
        raise ValueError("Path is outside the project root")
    return candidate


@dataclass
class ProjectPaths:
    root: Path
    meta_dir: Path
    memory: Path
    versions: Path
    prompts: Path
    conversations: Path


def project_paths(project_id: str) -> ProjectPaths:
    root = PROJECTS_ROOT / project_id
    meta_dir = DATA_ROOT / "projects" / project_id
    return ProjectPaths(
        root=root,
        meta_dir=meta_dir,
        memory=meta_dir / "memory.json",
        versions=meta_dir / "versions.json",
        prompts=meta_dir / "prompts.json",
        conversations=meta_dir / "conversations.json",
    )


def default_memory(name: str) -> dict[str, Any]:
    return {
        "projectName": name,
        "framework": "Unknown",
        "language": "Unknown",
        "cssFramework": "Unknown",
        "backend": "Existing CodeMate agent",
        "database": "None detected",
        "theme": "System",
        "installedLibraries": [],
        "environmentVariables": [],
        "buildCommands": [],
        "runCommands": [],
        "folderStructure": [],
        "aiNotes": [],
        "recentPrompts": [],
        "userPreferences": {},
        "updatedAt": utc_now(),
    }


def read_index() -> dict[str, Any]:
    ensure_storage()
    return load_json(INDEX_FILE, {"projects": [], "recent": []})


def write_index(index: dict[str, Any]) -> None:
    save_json(INDEX_FILE, index)


def create_project(name: str, template: str = "blank") -> dict[str, Any]:
    ensure_storage()
    index = read_index()
    project_id = f"{slugify(name)}-{uuid4().hex[:8]}"
    paths = project_paths(project_id)
    paths.root.mkdir(parents=True, exist_ok=True)
    paths.meta_dir.mkdir(parents=True, exist_ok=True)

    if template == "web":
        (paths.root / "index.html").write_text(
            "<!doctype html>\n<html>\n<head><title>CodeMate Project</title></head>\n"
            "<body><main id=\"app\">Ready for CodeMate Pro.</main></body>\n</html>\n",
            encoding="utf-8",
        )

    project = {
        "id": project_id,
        "name": name,
        "path": str(paths.root),
        "pinned": False,
        "favorite": False,
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
        "lastOpenedAt": utc_now(),
    }
    index["projects"].append(project)
    index["recent"] = [project_id] + [item for item in index.get("recent", []) if item != project_id]
    write_index(index)
    save_json(paths.memory, default_memory(name))
    save_json(paths.versions, [])
    save_json(paths.prompts, [])
    save_json(paths.conversations, [])
    create_version(project_id, "Project created", [], "Initial project metadata")
    return project


def get_project(project_id: str) -> dict[str, Any]:
    index = read_index()
    for project in index["projects"]:
        if project["id"] == project_id:
            return project
    raise KeyError(f"Project not found: {project_id}")


def list_projects() -> list[dict[str, Any]]:
    return sorted(read_index()["projects"], key=lambda item: item.get("lastOpenedAt", ""), reverse=True)


def update_project(project_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    index = read_index()
    for project in index["projects"]:
        if project["id"] == project_id:
            project.update({key: value for key, value in updates.items() if value is not None})
            project["updatedAt"] = utc_now()
            if updates.get("name"):
                paths = project_paths(project_id)
                memory = load_json(paths.memory, default_memory(project["name"]))
                memory["projectName"] = updates["name"]
                memory["updatedAt"] = utc_now()
                save_json(paths.memory, memory)
            write_index(index)
            return project
    raise KeyError(f"Project not found: {project_id}")


def touch_project(project_id: str) -> dict[str, Any]:
    project = update_project(project_id, {"lastOpenedAt": utc_now()})
    index = read_index()
    index["recent"] = [project_id] + [item for item in index.get("recent", []) if item != project_id]
    write_index(index)
    return project


def delete_project(project_id: str) -> None:
    index = read_index()
    get_project(project_id)
    index["projects"] = [project for project in index["projects"] if project["id"] != project_id]
    index["recent"] = [item for item in index.get("recent", []) if item != project_id]
    write_index(index)
    paths = project_paths(project_id)
    if paths.root.exists():
        shutil.rmtree(paths.root)
    if paths.meta_dir.exists():
        shutil.rmtree(paths.meta_dir)


def duplicate_project(project_id: str, name: str | None = None) -> dict[str, Any]:
    source = get_project(project_id)
    duplicate = create_project(name or f"{source['name']} Copy")
    source_paths = project_paths(project_id)
    target_paths = project_paths(duplicate["id"])
    if target_paths.root.exists():
        shutil.rmtree(target_paths.root)
    shutil.copytree(source_paths.root, target_paths.root)
    memory = load_json(source_paths.memory, default_memory(duplicate["name"]))
    memory["projectName"] = duplicate["name"]
    memory["updatedAt"] = utc_now()
    save_json(target_paths.memory, memory)
    return duplicate


def list_tree(project_id: str) -> list[dict[str, Any]]:
    root = project_paths(project_id).root
    root.mkdir(parents=True, exist_ok=True)
    items: list[dict[str, Any]] = []
    for path in sorted(root.rglob("*"), key=lambda value: str(value).lower()):
        rel = path.relative_to(root).as_posix()
        items.append({
            "path": rel,
            "name": path.name,
            "type": "directory" if path.is_dir() else "file",
            "size": path.stat().st_size if path.is_file() else 0,
            "updatedAt": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
        })
    return items


def read_project_file(project_id: str, relative_path: str) -> str:
    path = safe_child(project_paths(project_id).root, relative_path)
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(relative_path)
    return path.read_text(encoding="utf-8")


def write_project_file(project_id: str, relative_path: str, content: str) -> dict[str, Any]:
    path = safe_child(project_paths(project_id).root, relative_path)
    before = path.read_text(encoding="utf-8") if path.exists() and path.is_file() else None
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    modified = [relative_path] if before != content else []
    if modified:
        create_version(project_id, "Manual save", modified, f"Updated {relative_path}")
        update_memory_from_files(project_id)
    return {"path": relative_path, "modified": modified}


def create_file_entry(project_id: str, relative_path: str, entry_type: str) -> dict[str, str]:
    path = safe_child(project_paths(project_id).root, relative_path)
    if entry_type == "directory":
        path.mkdir(parents=True, exist_ok=True)
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch(exist_ok=False)
    create_version(project_id, f"Created {entry_type}", [relative_path], f"Created {relative_path}")
    update_memory_from_files(project_id)
    return {"path": relative_path, "type": entry_type}


def rename_entry(project_id: str, source: str, target: str) -> dict[str, str]:
    root = project_paths(project_id).root
    source_path = safe_child(root, source)
    target_path = safe_child(root, target)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    source_path.rename(target_path)
    create_version(project_id, "Renamed file", [source, target], f"Renamed {source} to {target}")
    update_memory_from_files(project_id)
    return {"source": source, "target": target}


def remove_entry(project_id: str, relative_path: str) -> None:
    path = safe_child(project_paths(project_id).root, relative_path)
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()
    create_version(project_id, "Deleted file", [relative_path], f"Deleted {relative_path}")
    update_memory_from_files(project_id)


def export_zip(project_id: str) -> Path:
    paths = project_paths(project_id)
    archive = paths.meta_dir / f"{project_id}.zip"
    paths.meta_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in paths.root.rglob("*"):
            if file_path.is_file():
                zip_file.write(file_path, file_path.relative_to(paths.root))
    return archive


def read_memory(project_id: str) -> dict[str, Any]:
    project = get_project(project_id)
    paths = project_paths(project_id)
    return load_json(paths.memory, default_memory(project["name"]))


def save_memory(project_id: str, memory: dict[str, Any]) -> dict[str, Any]:
    memory["updatedAt"] = utc_now()
    save_json(project_paths(project_id).memory, memory)
    return memory


def update_memory_from_files(project_id: str, prompt: str | None = None) -> dict[str, Any]:
    memory = read_memory(project_id)
    tree = list_tree(project_id)
    file_paths = [item["path"] for item in tree if item["type"] == "file"]
    memory["folderStructure"] = file_paths[:250]
    if "package.json" in file_paths:
        memory["framework"] = "React/Vite or Node project"
        memory["language"] = "TypeScript/JavaScript"
        try:
            package = json.loads(read_project_file(project_id, "package.json"))
            deps = sorted([*package.get("dependencies", {}).keys(), *package.get("devDependencies", {}).keys()])
            memory["installedLibraries"] = deps
            scripts = package.get("scripts", {})
            memory["buildCommands"] = [f"npm run {key}" for key in scripts if "build" in key]
            memory["runCommands"] = [f"npm run {key}" for key in scripts if key in {"dev", "start", "preview"}]
        except Exception:
            pass
    if any(path.endswith(".py") for path in file_paths):
        memory["language"] = "Python" if memory["language"] == "Unknown" else memory["language"]
    if any(path.endswith(".css") for path in file_paths):
        memory["cssFramework"] = "CSS/Tailwind candidate"
    if prompt:
        memory.setdefault("recentPrompts", [])
        memory["recentPrompts"] = [prompt, *memory["recentPrompts"][:19]]
    return save_memory(project_id, memory)


def create_version(project_id: str, prompt: str, modified_files: list[str], summary: str, duration_ms: int = 0) -> dict[str, Any]:
    paths = project_paths(project_id)
    versions = load_json(paths.versions, [])
    version = {
        "id": uuid4().hex,
        "prompt": prompt,
        "time": utc_now(),
        "modifiedFiles": modified_files,
        "summary": summary,
        "durationMs": duration_ms,
    }
    versions.insert(0, version)
    save_json(paths.versions, versions[:200])
    return version


def list_versions(project_id: str) -> list[dict[str, Any]]:
    return load_json(project_paths(project_id).versions, [])


def record_prompt(project_id: str, prompt: str, modified_files: list[str], result: str, duration_ms: int) -> dict[str, Any]:
    paths = project_paths(project_id)
    prompts = load_json(paths.prompts, [])
    item = {
        "id": uuid4().hex,
        "prompt": prompt,
        "timestamp": utc_now(),
        "filesModified": modified_files,
        "durationMs": duration_ms,
        "result": result,
    }
    prompts.insert(0, item)
    save_json(paths.prompts, prompts[:200])
    return item


def list_prompts(project_id: str) -> list[dict[str, Any]]:
    return load_json(project_paths(project_id).prompts, [])
