# Changelog

## v0.2 — 未发布

这一版没有加新节点，主要是把 v0.1 里「写出来会装不上」的地方修掉。

### 修正

- 尺寸契约：面板宽 320–1180 不是卡片宽；卡片内容宽约 185–1110，补了宽度表。
- `network` 权限与 `network.domains` 字段现在真的能在 schema 里声明，两者互相约束。
- `span` 进 manifest；`engine` 与 `runtime` 拆成两条兼容线。
- `fonts` 进 manifest；`assets` 与字体的关系写清楚。
- `id` 至少两段、不允许空段；`version` 接受合法的 prerelease + build metadata。
- 卸载语义统一为「删包与组件存储，不动用户数据」；存储配额统一为 5 MB / 200 keys / 256 KB。
- 包策略与解压安全上限分开写，避免 10 MB / 50 MB 看起来互相矛盾。
- 路径改为相对于宿主 `userData`，不再写死 `%APPDATA%`（便携版会变）。

### 范围

- v1 声明式组件明确为**只读**：没有 `input`、没有本地状态、没有逐行动作。
- `input` / `checkbox` / `state` 移到 v1.1 草案，不再假装 v1 能写表单。
- todo / media 在 v1 走脚本组件。

### 新增

- `spec/layout.schema.json`、`spec/catalog.schema.json`
- `spec/commands.json`、`spec/providers.json`
- `docs/providers.md`
- `registry/catalog.json` 与五个内置组件说明页
- `scripts/validate.py`、fixtures、GitHub Actions
- `STATUS.md`

## v0.1.0 — 2026-11

首个规范版本：manifest / IR / runtime / script / security / testing / roadmap，
`spec/widget.schema.json`，clock 与 counter 示例。
