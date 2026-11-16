#!/usr/bin/env python3
"""Validate the Sill component repository.

Checks, in this order:
  1. every JSON file parses;
  2. examples are valid manifests / layouts and pass semantic checks;
  3. registry/catalog.json is valid and its docs paths exist;
  4. spec/fixtures valid/ files pass their schema and invalid/ files fail it.

No network access. Python 3.10+.
"""

from __future__ import annotations

import json
import re
import sys
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
COMMANDS: dict = {}
LOCALES: dict[Path, set[str]] = {}

SCHEMAS = {
    "manifest": ROOT / "spec" / "widget.schema.json",
    "layout": ROOT / "spec" / "layout.schema.json",
    "catalog": ROOT / "spec" / "catalog.schema.json",
}

SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)
RANGE_TOKEN_RE = re.compile(r"^(>=|<=|>|<|=|\^|~)?\s*v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$")


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


def parse_version(text: str):
    match = SEMVER_RE.match(text)
    if not match:
        return None
    return tuple(int(match.group(i)) for i in range(1, 4))


def version_lt(a, b) -> bool:
    return a < b


def satisfies(version: str, spec: str) -> bool:
    """Small semver range checker: *, comparators, ^ and ~. Prerelease tags are ignored."""
    current = parse_version(version)
    if current is None:
        return False
    spec = spec.strip()
    if spec == "*":
        return True
    for token in spec.split():
        match = RANGE_TOKEN_RE.match(token)
        if not match:
            return False
        op = match.group(1) or "="
        target = parse_version(match.group(2))
        if target is None:
            return False
        if op == "=" and current != target:
            return False
        if op == ">" and not (current > target):
            return False
        if op == ">=" and not (current >= target):
            return False
        if op == "<" and not (current < target):
            return False
        if op == "<=" and not (current <= target):
            return False
        if op == "^":
            if current < target:
                return False
            major, minor, patch = target
            if major > 0:
                upper = (major + 1, 0, 0)
            elif minor > 0:
                upper = (0, minor + 1, 0)
            else:
                upper = (0, 0, patch + 1)
            if not (current < upper):
                return False
        if op == "~":
            if current < target:
                return False
            if not (current < (target[0], target[1] + 1, 0)):
                return False
    return True


# ---------- expression parser ----------

TOKEN_RE = re.compile(
    r'(?P<number>\d+(?:\.\d+)?)'
    r'|(?P<string>"(?:\\.|[^"\\])*")'
    r'|(?P<ident>[A-Za-z_][A-Za-z0-9_]*)'
    r'|(?P<op><=|>=|==|!=|[+\-*/%<>=(),.])'
)

FUNCTIONS = {
    "format": 2,
    "round": 1,
    "floor": 1,
    "ceil": 1,
    "if": 3,
}


class ExprError(ValueError):
    pass


class ExprParser:
    def __init__(self, text: str):
        self.text = text
        self.tokens: list[tuple[str, str]] = []
        self.pos = 0
        self._tokenize()
        self.current = 0

    def _tokenize(self) -> None:
        index = 0
        while index < len(self.text):
            if self.text[index].isspace():
                index += 1
                continue
            match = TOKEN_RE.match(self.text, index)
            if not match:
                raise ExprError(f"unexpected character {self.text[index]!r}")
            kind = match.lastgroup or "op"
            self.tokens.append((kind, match.group(0)))
            index = match.end()
        self.tokens.append(("eof", ""))

    def peek(self) -> tuple[str, str]:
        return self.tokens[self.current]

    def take(self, value: str | None = None) -> tuple[str, str]:
        token = self.tokens[self.current]
        if value is not None and token[1] != value:
            raise ExprError(f"expected {value!r}, got {token[1]!r}")
        self.current += 1
        return token

    def parse(self):
        node = self.parse_or()
        if self.peek()[0] != "eof":
            raise ExprError(f"unexpected token {self.peek()[1]!r}")
        return node

    def parse_or(self):
        node = self.parse_and()
        while self.peek()[1] == "or":
            self.take("or")
            node = ("or", node, self.parse_and())
        return node

    def parse_and(self):
        node = self.parse_not()
        while self.peek()[1] == "and":
            self.take("and")
            node = ("and", node, self.parse_not())
        return node

    def parse_not(self):
        if self.peek()[1] == "not":
            self.take("not")
            return ("not", self.parse_not())
        return self.parse_comparison()

    def parse_comparison(self):
        node = self.parse_add()
        while self.peek()[0] == "op" and self.peek()[1] in ("==", "!=", ">", ">=", "<", "<="):
            op = self.take()[1]
            node = ("cmp", op, node, self.parse_add())
        return node

    def parse_add(self):
        node = self.parse_mul()
        while self.peek()[0] == "op" and self.peek()[1] in ("+", "-"):
            op = self.take()[1]
            node = ("bin", op, node, self.parse_mul())
        return node

    def parse_mul(self):
        node = self.parse_unary()
        while self.peek()[0] == "op" and self.peek()[1] in ("*", "/", "%"):
            op = self.take()[1]
            node = ("bin", op, node, self.parse_unary())
        return node

    def parse_unary(self):
        if self.peek()[0] == "op" and self.peek()[1] == "-":
            self.take("-")
            return ("neg", self.parse_unary())
        return self.parse_primary()

    def parse_primary(self):
        kind, value = self.peek()
        if kind == "number":
            self.take()
            return ("number", float(value))
        if kind == "string":
            self.take()
            try:
                decoded = json.loads(value)
            except json.JSONDecodeError as exc:
                raise ExprError("bad string literal") from exc
            return ("string", decoded)
        if value == "(":
            self.take("(")
            node = self.parse_or()
            self.take(")")
            return node
        if kind == "ident":
            self.take()
            if value in ("true", "false"):
                return ("bool", value == "true")
            if value == "null":
                return ("null", None)
            if self.peek()[1] == "(":
                self.take("(")
                args = []
                if self.peek()[1] != ")":
                    args.append(self.parse_or())
                    while self.peek()[1] == ",":
                        self.take(",")
                        args.append(self.parse_or())
                self.take(")")
                if value not in FUNCTIONS:
                    raise ExprError(f"unknown function {value!r}")
                if len(args) != FUNCTIONS[value]:
                    raise ExprError(f"{value}() takes {FUNCTIONS[value]} arguments, got {len(args)}")
                return ("call", value, args)
            parts = [value]
            while self.peek()[1] == ".":
                self.take(".")
                nxt = self.peek()
                if nxt[0] != "ident":
                    raise ExprError("expected a field name after '.'")
                self.take()
                parts.append(nxt[1])
            return ("path", parts)
        raise ExprError(f"unexpected token {value!r}")


def collect_paths(node, out: list[list[str]]) -> None:
    if not isinstance(node, tuple):
        return
    if node[0] == "path":
        out.append(node[1])
        return
    for child in node[1:]:
        if isinstance(child, list):
            for item in child:
                collect_paths(item, out)
        else:
            collect_paths(child, out)


# ---------- manifest checks ----------

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


def check_provider_path(root: str, parts: list[str], ctx: dict) -> None:
    if root == "item":
        if not ctx.get("in_item"):
            error(ctx["file"], f"`item` is only available inside a list itemTemplate")
            return
        if len(parts) < 2:
            error(ctx["file"], "`item` must be followed by a field")
            return
        item_fields = ctx.get("item_fields")
        if item_fields and parts[1] not in item_fields:
            error(ctx["file"], f"unknown item field `item.{parts[1]}`")
        return
    if root == "settings":
        if len(parts) < 2:
            error(ctx["file"], "`settings` must be followed by a key")
            return
        if parts[1] not in ctx["settings"]:
            error(ctx["file"], f"unknown setting `settings.{parts[1]}`")
        return
    if root not in ctx["data"]:
        error(ctx["file"], f"unknown binding root `{root}`")
        return
    if len(parts) < 2:
        error(ctx["file"], f"binding `{root}` needs a field")
        return
    source = ctx["data"][root]
    provider = ctx["providers"].get(source)
    if provider is None:
        error(ctx["file"], f"unknown provider `{source}`")
        return
    if parts[1] not in provider.get("fields", {}):
        error(ctx["file"], f"provider `{source}` has no field `{parts[1]}`")


def check_expression(text: str, ctx: dict) -> None:
    if not isinstance(text, str) or not text:
        error(ctx["file"], "empty expression")
        return
    try:
        node = ExprParser(text).parse()
    except ExprError as exc:
        error(ctx["file"], f"bad expression {text!r}: {exc}")
        return
    paths: list[list[str]] = []
    collect_paths(node, paths)
    for parts in paths:
        check_provider_path(parts[0], parts, ctx)


def check_i18n(node: dict, ctx: dict) -> None:
    key = node.get("key")
    if not isinstance(key, str):
        return
    if not ctx["locale_keys"]:
        error(ctx["file"], f"i18n key `{key}` used but no locales are declared")
    elif key not in ctx["locale_keys"]:
        error(ctx["file"], f"i18n key `{key}` is missing from locales/en.json")


def check_action(action: dict, ctx: dict) -> None:
    name = action.get("name")
    command = ctx["commands"].get(name)
    if command is None:
        error(ctx["file"], f"unknown command `{name}`")
        return
    permission = command.get("permission")
    if permission and permission not in ctx["permissions"]:
        error(ctx["file"], f"command `{name}` needs permission `{permission}`")
    expected = command.get("args", {})
    actual = action.get("args", {}) or {}
    for key in expected:
        if key not in actual:
            error(ctx["file"], f"command `{name}` is missing arg `{key}`")
    for key in actual:
        if key not in expected:
            error(ctx["file"], f"command `{name}` has unknown arg `{key}`")
    if name == "app.openUrl" and isinstance(actual.get("url"), str):
        if not actual["url"].startswith("https://"):
            error(ctx["file"], "app.openUrl only accepts https://")


def check_asset(value: str, ctx: dict) -> None:
    if not isinstance(value, str):
        return
    if value.startswith("https://"):
        domain = urlparse(value).hostname or ""
        if "network" not in ctx["permissions"]:
            error(ctx["file"], f"remote image `{value}` needs the network permission")
        elif domain not in ctx["domains"]:
            error(ctx["file"], f"remote image domain `{domain}` is not in network.domains")
        return
    if not value.startswith("assets/"):
        error(ctx["file"], f"local image `{value}` must start with assets/")
        return
    if value not in ctx["assets"]:
        error(ctx["file"], f"image `{value}` is not declared in manifest assets")
        return
    if not (ctx["widget_dir"] / value).is_file():
        error(ctx["file"], f"image `{value}` does not exist")


def check_items(value: str, ctx: dict) -> dict:
    try:
        node = ExprParser(value).parse()
    except ExprError as exc:
        error(ctx["file"], f"bad list items expression {value!r}: {exc}")
        return {}
    if node[0] != "path":
        error(ctx["file"], "list.items must be a single provider path")
        return {}
    parts = node[1]
    if len(parts) < 2:
        error(ctx["file"], "list.items needs a provider field")
        return {}
    root = parts[0]
    if root not in ctx["data"]:
        error(ctx["file"], f"unknown list data root `{root}`")
        return {}
    source = ctx["data"][root]
    provider = ctx["providers"].get(source, {})
    is_array = provider.get("shape") == "array"
    if len(parts) > 1 and parts[1] in provider.get("arrayFields", []):
        is_array = True
    if not is_array:
        error(ctx["file"], f"`{value}` is not an array provider")
    return provider.get("arrayItem", {}) or provider.get("item", {})


def walk_layout(node: dict, ctx: dict) -> None:
    node_type = node.get("type")
    if node_type in ("vstack", "hstack", "overlay"):
        for child in node.get("children", []):
            walk_layout(child, ctx)
        return
    if node_type == "text":
        if "bind" in node:
            check_expression(node["bind"], ctx)
        if "i18n" in node:
            check_i18n(node["i18n"], ctx)
        return
    if node_type == "image":
        if "src" in node:
            check_asset(node["src"], ctx)
        if "bind" in node:
            check_expression(node["bind"], ctx)
        for value in (node.get("map") or {}).values():
            check_asset(value, ctx)
        if "fallback" in node:
            check_asset(node["fallback"], ctx)
        if "altI18n" in node:
            check_i18n(node["altI18n"], ctx)
        return
    if node_type in ("bar", "ring"):
        check_expression(node["bind"], ctx)
        low = node.get("min", 0)
        high = node.get("max", 100)
        if low >= high:
            error(ctx["file"], f"{node_type} needs min < max (got {low} and {high})")
        return
    if node_type == "divider":
        return
    if node_type == "spacer":
        return
    if node_type == "list":
        item_fields = check_items(node["items"], ctx)
        child_ctx = dict(ctx)
        child_ctx["in_item"] = True
        child_ctx["item_fields"] = item_fields
        walk_layout(node["itemTemplate"], child_ctx)
        if "empty" in node:
            walk_layout(node["empty"], ctx)
        return
    if node_type == "button":
        if "action" in node:
            check_action(node["action"], ctx)
        if "disabled" in node:
            check_expression(node["disabled"], ctx)
        if "i18n" in node:
            check_i18n(node["i18n"], ctx)
        if "ariaI18n" in node:
            check_i18n(node["ariaI18n"], ctx)
        if "icon" in node:
            check_asset(node["icon"], ctx)
        return
    error(ctx["file"], f"unknown IR node type `{node_type}`")


def check_layout_file(path: Path, manifest: dict) -> None:
    data, problems = validate_schema(path, "layout")
    if problems:
        return
    ctx = {
        "file": path,
        "data": {item["id"]: item["source"] for item in manifest.get("data", [])},
        "settings": {item["key"] for item in manifest.get("settings", [])},
        "providers": PROVIDERS,
        "commands": COMMANDS,
        "permissions": set(manifest.get("permissions", [])),
        "domains": set((manifest.get("network") or {}).get("domains", [])),
        "assets": set(manifest.get("assets", [])),
        "widget_dir": path.parent.parent,
        "locale_keys": LOCALES.get(path.parent.parent, set()),
        "in_item": False,
        "item_fields": {},
    }
    walk_layout(data, ctx)


def check_settings(manifest: dict, path: Path) -> None:
    seen = set()
    for setting in manifest.get("settings", []):
        key = setting["key"]
        if key in seen:
            error(path, f"duplicate setting key `{key}`")
        seen.add(key)
        default = setting["default"]
        kind = setting["type"]
        if kind == "number":
            low = setting.get("min")
            high = setting.get("max")
            if low is not None and high is not None and low > high:
                error(path, f"setting `{key}` has min > max")
            if low is not None and default < low:
                error(path, f"setting `{key}` default is below min")
            if high is not None and default > high:
                error(path, f"setting `{key}` default is above max")
        if kind == "select":
            values = [option["value"] for option in setting.get("options", [])]
            if default not in values:
                error(path, f"setting `{key}` default is not in options")
        if kind == "string":
            limit = setting.get("maxLength")
            if limit is not None and len(default) > limit:
                error(path, f"setting `{key}` default is longer than maxLength")
        label = setting.get("label", {})
        if not label:
            error(path, f"setting `{key}` has no label")


def load_locales(widget_dir: Path) -> set[str]:
    """Validate locale files and return the keys defined in en.json."""
    en_keys: set[str] = set()
    for language in ("en", "zh"):
        path = widget_dir / "locales" / f"{language}.json"
        if not path.is_file():
            continue
        data = read_json(path)
        if not isinstance(data, dict):
            error(path, "locale file must be a flat object")
            continue
        for key, value in data.items():
            if not isinstance(value, str):
                error(path, f"locale `{key}` must be a string")
            if language == "en":
                en_keys.add(key)
    return en_keys


def check_manifest(path: Path) -> None:
    data, problems = validate_schema(path, "manifest")
    if problems:
        return
    widget_dir = path.parent
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        error(path, "widget.json must not start with a BOM")

    for field in ("runtime", "engine"):
        if not data.get(field):
            error(path, f"missing {field}")
        else:
            parts = data[field].split()
            for token in parts:
                if token == "*":
                    continue
                if not RANGE_TOKEN_RE.match(token):
                    error(path, f"{field} has an unsupported range token `{token}`")
                    break

    data_map = {}
    for item in data.get("data", []):
        key = item["id"]
        source = item["source"]
        if key in data_map:
            error(path, f"duplicate data id `{key}`")
        data_map[key] = source
        provider = PROVIDERS.get(source)
        if provider is None:
            error(path, f"unknown provider `{source}`")
            continue
        needed = provider.get("permission")
        if needed and needed not in data.get("permissions", []):
            error(path, f"provider `{source}` needs permission `{needed}`")

    if data.get("type") == "declarative":
        if not data["ui"].endswith(".json"):
            error(path, "declarative ui must be a .json file")
    else:
        if not data["ui"].endswith(".js"):
            error(path, "script ui must be a .js file")

    for field in ("ui",):
        target = file_under(widget_dir, data[field])
        if target is None:
            error(path, f"{field} must stay inside the package")
        elif not target.is_file():
            error(path, f"{field} points to a missing file: {data[field]}")
        elif target.stat().st_size > 2 * 1024 * 1024:
            error(path, f"{field} is larger than 2 MB")

    assets = []
    for value in data.get("assets", []):
        target = file_under(widget_dir, value)
        if target is None:
            error(path, f"asset `{value}` must stay inside the package")
            continue
        if not target.is_file():
            error(path, f"asset `{value}` does not exist")
            continue
        if target.stat().st_size > 2 * 1024 * 1024:
            error(path, f"asset `{value}` is larger than 2 MB")
        assets.append(value)
    if len(assets) != len(set(assets)):
        error(path, "assets contain duplicates")
    total = 0
    for value in assets:
        target = widget_dir / value
        if target.is_file():
            total += target.stat().st_size
    if total > 10 * 1024 * 1024:
        error(path, "assets exceed the 10 MB package budget")
    if len(assets) > 200:
        error(path, "assets exceed the 200 file budget")

    package_files = [
        item for item in widget_dir.rglob("*") if item.is_file() and ".git" not in item.parts
    ]
    package_total = sum(item.stat().st_size for item in package_files)
    if package_total > 10 * 1024 * 1024:
        error(path, "package exceeds the 10 MB budget")
    if len(package_files) > 200:
        error(path, "package exceeds the 200 file budget")

    for font in data.get("fonts", []):
        src = font["src"]
        if src not in assets:
            error(path, f"font `{src}` must also be listed in assets")
        if not src.endswith(".woff2"):
            error(path, f"font `{src}` must be a .woff2 file")
        target = file_under(widget_dir, src)
        if target is None or not target.is_file():
            error(path, f"font `{src}` does not exist")

    check_settings(data, path)

    locales = load_locales(widget_dir)
    for language, value in (data.get("locales") or {}).items():
        target = file_under(widget_dir, value)
        if target is None:
            error(path, f"locale `{language}` must stay inside the package")
        elif not target.is_file():
            error(path, f"locale `{language}` points to a missing file")
    LOCALES[widget_dir] = locales

    span = data.get("span") or {}
    if "byColumns" in span:
        for columns, value in span["byColumns"].items():
            if value > int(columns):
                error(path, f"span.byColumns[{columns}] = {value} exceeds {columns} columns")

    for domain in (data.get("network") or {}).get("domains", []):
        if re.match(r"^\d{1,3}(?:\.\d{1,3}){3}$", domain):
            error(path, f"network domain `{domain}` must not be an IP literal")
        if domain != domain.lower():
            error(path, f"network domain `{domain}` must be lowercase")

    if data.get("type") == "declarative":
        layout = widget_dir / data["ui"]
        if layout.is_file():
            check_layout_file(layout, data)
    else:
        script = widget_dir / data["ui"]
        if script.is_file():
            text = script.read_text(encoding="utf-8", errors="replace")
            for pattern, label in (
                (r"\beval\s*\(", "eval("),
                (r"\bnew\s+Function\b", "new Function"),
                (r"\bdocument\.write\s*\(", "document.write"),
                (r"\bwindow\.open\s*\(", "window.open"),
                (r"\blocalStorage\b", "localStorage"),
                (r"\brequire\s*\(", "require("),
                (r"(?<!ctx\.)\bfetch\s*\(", "direct fetch("),
            ):
                if re.search(pattern, text):
                    error(script, f"static scan found `{label}`; use ctx instead")


def check_examples() -> None:
    for manifest_path in sorted((ROOT / "examples").glob("*/widget.json")):
        check_manifest(manifest_path)


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


# ---------- fixtures ----------

def check_fixtures() -> None:
    kinds = {
        "manifest": ROOT / "spec" / "fixtures" / "manifest",
        "layout": ROOT / "spec" / "fixtures" / "layout",
        "catalog": ROOT / "spec" / "fixtures" / "catalog",
    }
    for kind, base in kinds.items():
        for path in sorted((base / "valid").glob("*.json")):
            _, problems = schema_problems(path, kind)
            if problems:
                error(path, f"valid fixture must pass the {kind} schema")
        for path in sorted((base / "invalid").glob("*.json")):
            _, problems = schema_problems(path, kind)
            if problems == 0:
                error(path, f"invalid fixture unexpectedly passes the {kind} schema")


# ---------- markdown links ----------

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


# ---------- json parse ----------

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


def check_target(raw: str) -> None:
    path = Path(raw)
    if path.is_dir():
        manifest = path / "widget.json"
    else:
        manifest = path
    if not manifest.is_file():
        error(manifest, "no widget.json found")
        return
    check_manifest(manifest)


def main() -> int:
    PROVIDERS.update(read_json(ROOT / "spec" / "providers.json")["providers"])
    COMMANDS.update({item["name"]: item for item in read_json(ROOT / "spec" / "commands.json")["commands"]})

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
