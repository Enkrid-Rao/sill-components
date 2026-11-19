#!/usr/bin/env python3
"""Validate Sill template widgets.

Checks:
  1. every JSON parses;
  2. examples are valid manifests + templates + CSS;
  3. registry/catalog.json is valid and its docs exist;
  4. spec/fixtures valid/ passes and invalid/ fails;
  5. relative Markdown links exist.

Template HTML/CSS is not reviewed: the host renders it with innerHTML, so author
markup (SVG, inline style, images) is allowed and scripts stay inert. The validator
only checks bindings, budgets and manifest wiring.

No network access. Python 3.10+.
"""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:  # pragma: no cover
    print("jsonschema is missing: python -m pip install -r requirements.txt", file=sys.stderr)
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parent.parent
ERRORS: list[str] = []
CHECKED = 0
PROVIDERS: dict = {}

SCHEMAS = {
    "manifest": ROOT / "spec" / "widget.schema.json",
    "catalog": ROOT / "spec" / "catalog.schema.json",
}

RANGE_TOKEN_RE = re.compile(r"^(>=|<=|>|<|=|\^|~)?\s*v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$")

ACTIONS = {"media.playpause", "media.next", "media.prev", "media.mute", "todo.toggle"}


def rel(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def error(path: Path | str, message: str) -> None:
    where = rel(path) if isinstance(path, Path) else path
    ERRORS.append(f"{where}: {message}")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def schema_validator(kind: str) -> Draft202012Validator:
    schema = read_json(SCHEMAS[kind])
    return Draft202012Validator(schema, format_checker=FormatChecker())


def schema_problems(path: Path, kind: str) -> tuple[object, list]:
    data = read_json(path)
    validator = schema_validator(kind)
    return data, sorted(validator.iter_errors(data), key=lambda e: list(e.path))


def validate_schema(path: Path, kind: str) -> tuple[object, int]:
    data, problems = schema_problems(path, kind)
    for problem in problems:
        at = "/".join(str(part) for part in problem.path) or "<root>"
        error(path, f"{kind} schema: {problem.message} (at {at})")
    return data, len(problems)


def check_range(path: Path, field: str, value: str) -> None:
    for token in value.split():
        if token == "*":
            continue
        if not RANGE_TOKEN_RE.match(token):
            error(path, f"{field} has an unsupported range token `{token}`")
            return


def safe_rel(value: str) -> bool:
    if not value or value.startswith(("/", "\\")):
        return False
    if "\\" in value or ":" in value:
        return False
    return all(part not in ("", ".", "..") for part in value.split("/"))


def file_under(base: Path, value: str) -> Path | None:
    if not safe_rel(value):
        return None
    target = (base / value).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError:
        return None
    return target


# ---------- template HTML / CSS ----------


class TemplateHtml(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.problems: list[str] = []
        self.bindings: list[str] = []
        self.repeats: list[str] = []
        self.conditions: list[str] = []
        self.meters: list[str] = []
        self.action_args: list[str] = []
        self.actions: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._tag(tag, attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._tag(tag, attrs)

    def _tag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            attribute = name.lower()
            if attribute == "data-sill-text":
                if value:
                    self.bindings.append(value)
                else:
                    self.problems.append("data-sill-text has no value")
            if attribute == "data-sill-repeat":
                if value:
                    self.repeats.append(value)
                else:
                    self.problems.append("data-sill-repeat has no value")
            if attribute == "data-sill-meter":
                if value:
                    self.meters.append(value)
                else:
                    self.problems.append("data-sill-meter has no value")
            if attribute == "data-sill-action":
                if value and value not in ACTIONS:
                    self.problems.append(f"unknown action `{value}`")
                elif value:
                    self.actions.append(value)
            if attribute == "data-sill-action-arg":
                if value:
                    self.action_args.append(value)
                else:
                    self.problems.append("data-sill-action-arg has no value")
            if attribute == "data-sill-if":
                if value:
                    self.conditions.append(value)
                else:
                    self.problems.append("data-sill-if has no value")


def path_problems(path: str, data_map: dict[str, str], has_repeat: bool) -> list[str]:
    clean = path[1:] if path.startswith("!") else path
    parts = clean.split(".")
    root = parts[0]
    if root == "item" and has_repeat:
        return []
    if root not in data_map:
        return [f"binding root `{root}` is not declared in data"]
    if len(parts) == 1:
        return []
    provider = PROVIDERS.get(data_map[root])
    if provider is None:
        return [f"unknown provider `{data_map[root]}`"]
    if parts[1] not in provider.get("fields", {}):
        return [f"provider `{data_map[root]}` has no field `{parts[1]}`"]
    return []


def template_problems(html: str, data_map: dict[str, str]) -> tuple[list[str], list[str]]:
    parser = TemplateHtml()
    parser.feed(html)
    parser.close()
    problems = list(parser.problems)
    for binding in parser.bindings:
        problems.extend(path_problems(binding, data_map, bool(parser.repeats)))
    for path in parser.repeats + parser.conditions:
        problems.extend(path_problems(path, data_map, bool(parser.repeats)))
    return problems, parser.bindings


def check_template(widget_dir: Path, manifest: dict, html_path: Path) -> None:
    if manifest.get("type") == "web":
        js_path = html_path.parent / "main.js"
        if not js_path.is_file():
            error(html_path.parent, "missing ui/main.js for web component")
            return
        if html_path.stat().st_size > 1024 * 1024:
            error(html_path, "web HTML is larger than 1 MB")
        if js_path.stat().st_size > 1024 * 1024:
            error(js_path, "web JS is larger than 1 MB")
        return

    css_path = html_path.parent / "style.css"
    # style.css 是可选的：可以直接把样式写在 index.html 的 <style> 里。
    if html_path.stat().st_size > 512 * 1024:
        error(html_path, "template HTML is larger than 512 KB")
    if css_path.is_file() and css_path.stat().st_size > 512 * 1024:
        error(css_path, "template CSS is larger than 512 KB")

    data_map = {item["id"]: item["source"] for item in manifest.get("data", [])}
    html = html_path.read_text(encoding="utf-8")
    problems, _ = template_problems(html, data_map)
    for problem in problems:
        error(html_path, problem)
    for action in re.findall(r'data-sill-action=["\']([^"\']+)["\']', html):
        if action.startswith("media.") and "action.media" not in manifest.get("permissions", []):
            error(html_path, f"action `{action}` needs permission `action.media`")
        if action.startswith("todo.") and "action.todo" not in manifest.get("permissions", []):
            error(html_path, f"action `{action}` needs permission `action.todo`")


def check_manifest(path: Path) -> None:
    data, problems = validate_schema(path, "manifest")
    if problems:
        return
    widget_dir = path.parent

    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        error(path, "widget.json must not start with a BOM")

    for field in ("runtime", "engine"):
        # 可选元数据：写了才检查格式。
        if field in data:
            check_range(path, field, data[field])

    data_map: dict[str, str] = {}
    for item in data.get("data", []):
        key = item["id"]
        source = item["source"]
        if key in data_map:
            error(path, f"duplicate data id `{key}`")
        data_map[key] = source
        if PROVIDERS.get(source) is None:
            error(path, f"unknown provider `{source}`")

    settings_keys: set[str] = set()
    for field in data.get("settings", []):
        key = field["key"]
        if key in settings_keys:
            error(path, f"duplicate setting key `{key}`")
        settings_keys.add(key)
        if field["type"] == "select" and not field.get("options"):
            error(path, f"setting `{key}` is a select without options")

    ui = file_under(widget_dir, data["ui"])
    if ui is None:
        error(path, "ui must stay inside the package")
        return
    if not ui.is_file():
        error(path, f"ui points to a missing file: {data['ui']}")
        return

    span = data.get("span") or {}
    for columns, value in (span.get("byColumns") or {}).items():
        if value > int(columns):
            error(path, f"span.byColumns[{columns}] = {value} exceeds {columns} columns")

    package_files = [
        item for item in widget_dir.rglob("*") if item.is_file() and ".git" not in item.parts
    ]
    # 与宿主安装器一致：根目录只放元数据，其余文件都在 ui/ 下。
    root_allowed = {"widget.json", "README.md", "LICENSE", "LICENSE.txt", "NOTICE"}
    for item in package_files:
        relative = item.relative_to(widget_dir).as_posix()
        if relative in root_allowed or relative.startswith("ui/"):
            continue
        if relative.endswith(".sill"):
            continue
        error(path, f"file `{relative}` is not allowed (root metadata + ui/** only)")
    if len(package_files) > 500:
        error(path, "package exceeds the 500 file budget")
    total = sum(item.stat().st_size for item in package_files)
    if total > 50 * 1024 * 1024:
        error(path, "package exceeds the 50 MB budget")

    check_template(widget_dir, data, ui)


def check_examples() -> None:
    for manifest in sorted((ROOT / "examples").glob("*/widget.json")):
        check_manifest(manifest)


# ---------- catalog ----------


def check_catalog() -> None:
    path = ROOT / "registry" / "catalog.json"
    data, problems = validate_schema(path, "catalog")
    if problems:
        return
    seen = set()
    for entry in data["widgets"]:
        if entry["id"] in seen:
            error(path, f"duplicate catalog id `{entry['id']}`")
        seen.add(entry["id"])
        docs = file_under(ROOT, entry["docs"])
        if docs is None:
            error(path, f"docs path `{entry['docs']}` escapes the repo")
        elif not docs.is_file():
            error(path, f"docs file `{entry['docs']}` does not exist")
        preview = entry.get("preview")
        if preview:
            target = file_under(ROOT, preview)
            if target is None or not target.is_file():
                error(path, f"preview `{preview}` does not exist")
        source = entry.get("source")
        if source:
            parsed = urlparse(source["repo"])
            if parsed.scheme not in ("https", "http") or not parsed.netloc:
                error(path, f"source.repo `{source['repo']}` is not an http(s) URL")
        if entry["type"] == "builtin" and entry.get("installable") is True:
            error(path, f"builtin `{entry['id']}` cannot be installable before a package exists")
        if entry["type"] == "template" and entry.get("installable") is not True:
            error(path, f"template `{entry['id']}` should be installable once packaged")


# ---------- fixtures ----------


def check_fixtures() -> None:
    for kind, base in (
        ("manifest", ROOT / "spec" / "fixtures" / "manifest"),
        ("catalog", ROOT / "spec" / "fixtures" / "catalog"),
    ):
        for path in sorted((base / "valid").glob("*.json")):
            _, problems = schema_problems(path, kind)
            if problems:
                error(path, f"valid fixture must pass the {kind} schema")
        for path in sorted((base / "invalid").glob("*.json")):
            _, problems = schema_problems(path, kind)
            if problems == 0:
                error(path, f"invalid fixture unexpectedly passes the {kind} schema")

    template_dir = ROOT / "spec" / "fixtures" / "template"
    data_map = {"now": "time.now"}
    for path in sorted((template_dir / "valid").glob("*.html")):
        problems, _ = template_problems(path.read_text(encoding="utf-8"), data_map)
        for problem in problems:
            error(path, problem)
    for path in sorted((template_dir / "invalid").glob("*.html")):
        problems, _ = template_problems(path.read_text(encoding="utf-8"), data_map)
        if not problems:
            error(path, "invalid template fixture unexpectedly passes")


# ---------- JSON / links ----------


def check_json_parse() -> None:
    global CHECKED
    for path in sorted(ROOT.rglob("*.json")):
        if any(part in {".git", "node_modules"} for part in path.parts):
            continue
        CHECKED += 1
        try:
            read_json(path)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            error(path, f"invalid JSON: {exc}")


MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")


def check_links() -> None:
    for path in sorted(ROOT.rglob("*.md")):
        if any(part in {".git", "node_modules"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8")
        for raw in MD_LINK_RE.findall(text):
            target = raw.strip()
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            if target.startswith("<") and target.endswith(">"):
                target = target[1:-1]
            target = target.split("#", 1)[0]
            if not target:
                continue
            if target.startswith("/"):
                error(path, f"absolute link `{raw}` is not allowed")
                continue
            if not (path.parent / target).exists():
                error(path, f"broken link `{raw}`")


def check_target(raw: str) -> None:
    path = Path(raw)
    manifest = path / "widget.json" if path.is_dir() else path
    if not manifest.is_file():
        error(manifest, "no widget.json found")
        return
    check_manifest(manifest)


def main() -> int:
    global PROVIDERS
    PROVIDERS = read_json(ROOT / "spec" / "providers.json")["providers"]

    targets = sys.argv[1:]
    check_json_parse()
    if targets:
        for target in targets:
            check_target(target)
    else:
        check_examples()
        check_catalog()
        check_fixtures()
        check_links()

    if ERRORS:
        print(f"validate: {len(ERRORS)} problem(s)\n", file=sys.stderr)
        for line in ERRORS:
            print(f"  {line}", file=sys.stderr)
        return 1
    scope = ", ".join(targets) if targets else "examples, catalog, fixtures"
    print(f"validate: ok ({CHECKED} JSON files; {scope})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
