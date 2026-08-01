import contextvars
import pathlib
import subprocess
from typing import Tuple

from langchain_core.tools import tool

DEFAULT_PROJECT_ROOT = pathlib.Path.cwd() / "generated_project"
_project_root: contextvars.ContextVar[pathlib.Path] = contextvars.ContextVar(
    "codemate_project_root",
    default=DEFAULT_PROJECT_ROOT,
)


def set_project_root(path: str | pathlib.Path) -> None:
    """Sets the active project root for tool calls in the current execution context."""
    _project_root.set(pathlib.Path(path).resolve())


def get_project_root() -> pathlib.Path:
    return _project_root.get().resolve()


def safe_path_for_project(path: str) -> pathlib.Path:
    root = get_project_root()
    p = (root / path).resolve()
    if root not in p.parents and root != p.parent and root != p:
        raise ValueError("Attempt to write outside project root")
    return p


@tool
def write_file(path: str, content: str) -> str:
    """Writes content to a file at the specified path within the project root."""
    p = safe_path_for_project(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    return f"WROTE:{p}"


@tool
def read_file(path: str) -> str:
    """Reads content from a file at the specified path within the project root."""
    p = safe_path_for_project(path)
    if not p.exists():
        return ""
    with open(p, "r", encoding="utf-8") as f:
        return f.read()


@tool
def get_current_directory() -> str:
    """Returns the current working directory."""
    return str(get_project_root())


@tool
def list_files(directory: str = ".") -> str:
    """Lists all files in the specified directory within the project root."""
    p = safe_path_for_project(directory)
    if not p.is_dir():
        return f"ERROR: {p} is not a directory"
    root = get_project_root()
    files = [str(f.relative_to(root)) for f in p.glob("**/*") if f.is_file()]
    return "\n".join(files) if files else "No files found."

@tool
def run_cmd(cmd: str, cwd: str = None, timeout: int = 30) -> Tuple[int, str, str]:
    """Runs a shell command in the specified directory and returns the result."""
    cwd_dir = safe_path_for_project(cwd) if cwd else PROJECT_ROOT
    res = subprocess.run(cmd, shell=True, cwd=str(cwd_dir), capture_output=True, text=True, timeout=timeout)
    return res.returncode, res.stdout, res.stderr


def init_project_root():
    root = get_project_root()
    root.mkdir(parents=True, exist_ok=True)
    return str(root)
