# 状态

这份文件是「现在到底有什么」的唯一真值。其他文档描述契约与目标，不重复状态数字。

最后核对：2026-11-18，对照 Sill `0.5.4` 与开发分支 `b9a5ca1`。

## 版本

| 项 | 值 | 说明 |
|---|---|---|
| 正式宿主 | Sill 0.5.4 | 只有内置组件，没有模板引擎 / 安装器 |
| 开发宿主 | Sill `main` `b9a5ca1` | 模板渲染、动态布局、本地 `.sill` 安装 |
| 组件规范 | v0.3 | 本仓库 `main`；最后 tag 是 `v0.1.0` |
| manifest `schema` | 1 | 未变 |
| 模板引擎目标版本 | 0.1.0 | 开发分支可用，未打 tag |
| 目录 `schema` | 1 | `registry/catalog.json` |

## 分层状态

| 层 | 状态 | 证据 / 位置 |
|---|---|---|
| manifest 校验 | 规范完成；Sill 开发分支安装器已接入基础校验 | `spec/widget.schema.json`、`scripts/validate.py`、Sill `main/widgets/package.ts` |
| 模板渲染 | **开发分支可用** | Sill `TemplateWidget` + Shadow DOM |
| 动态布局 id | **开发分支可用** | `normalizeLayout(raw, knownIds)` |
| 本地 `.sill` 安装 | **开发分支可用** | 设置 → 行为 → 组件 → 安装组件… |
| 卸载 | **开发分支可用** | 设置里的已安装列表 |
| CLI（validate / pack / new / dev） | **开发分支可用** | `packages/cli`，`pnpm sill` |
| 目录下载 / 更新 | **未实现** | 没有下载通道 |
| 权限确认 | **开发分支可用** | 安装前显示 id / 版本 / 作者 / 权限 |
| 签名 / 哈希 | **未实现** | 安装时只做静态校验 |
| 第三方组件分发 | **未开放** | 只能本地安装，不能从目录下载 |

## 当前能力

- 组件是 `widget.json` + `ui/index.html` + `ui/style.css`；
- 宿主清洗 HTML/CSS 后挂到 Shadow DOM，放在 `WidgetShell` 的 `.card` 里；
- 玻璃、圆角、atmosphere 由 `.card` / `.rail__atmo` 提供，模板只画内容；
- v1 不执行 JS、不联网、不写数据；支持 `data-sill-text` / `i18n` / `if` / `repeat` / `action` / `meter`；
- 本地 `.sill` 可以安装、隐藏、拖拽、跨列、卸载；
- `pnpm sill validate/pack/new/dev` 可以在 Sill 工作区使用；
- 安装路径 `<userData>/components/<id>@<version>/`，原子写入。

## 兼容矩阵

| 组件声明 | 正式 0.5.4 | 开发 main |
|---|---|---|
| `type: template`，`engine >=0.1.0` | 否 | 是 |
| `type: template`，`engine >=0.2.0` | 否 | 否 |
| 旧 `type: declarative` / `script` | 否 | 否，v0.3 已移除 |
| 内置组件（非 `.sill`） | 是 | 是 |

## 已验证

- `examples/clock` 通过 manifest schema 与模板校验。
- `registry/catalog.json` 通过 catalog schema，五个 `docs` 路径存在。
- `python scripts/validate.py` 本地通过，GitHub Actions 通过。
- Sill 开发分支的 `.sill` 安装、加载、卸载通过程序化测试。
- 额外文件 / 路径穿越 / `<script>` / CSS `url()` 四类坏包被拒绝。
- 模板卡在默认 / Lagoon / 320 宽 / 安装后布局下截图核对过。
- `examples/processes` 的 repeat / if / i18n 与 `examples/media` 的 action / meter 安装后渲染正常。
- `pnpm test`：安装器 + provider 13 个测试通过；`verify.yml` 通过。

## 未验证 / 已知缺口

- 没有目录下载、自动更新。
- CLI 只在 Sill 工作区可用，没有发布成全局 `sill`。
- 安装时没有签名、哈希校验。
- 同一个 id 只能装一个版本；升级要先卸载。
- 动作只有 `media.*` / `todo.toggle`，需要对应 `action.*` 权限；
- 没有格式化函数、图片资源、通用样式绑定。
- sanitizer 是 v1 白名单，还没有完整安全测试集。
- 五个内置组件仍是 React 实现，没有迁到模板。
- webview / 任意 JS 组件还没有开始。

## 更新规则

- 状态变化时先改这份文件，再改相关文档。
- 不要在其他文档里写「已实现 / 计划中」的独立版本号；引用本文件。
- 打 tag 前确认「已验证」一节没有过期项。
