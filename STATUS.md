# 状态

这份文件是「现在到底有什么」的唯一真值。其他文档描述契约与目标，不重复状态数字。

最后核对：2026-11-16，对照 Sill `0.5.1`（`D:\Projects\Sill`，无远端）。

## 版本

| 项 | 值 | 说明 |
|---|---|---|
| 宿主 Sill | 0.5.1 | `package.json` |
| 组件规范 | v0.2（未打 tag） | 本文档所在仓库；最后 tag 是 `v0.1.0` |
| manifest `schema` | 1 | 未变 |
| 引擎目标版本 | 0.1.0 | 尚未实现 |
| 目录 `schema` | 1 | `registry/catalog.json` |

## 分层状态

| 层 | 状态 | 证据 / 位置 |
|---|---|---|
| manifest 校验 | 规范完成，宿主未接入 | `spec/widget.schema.json`、`scripts/validate.py` |
| IR 解析 / 编译 | **未实现** | Sill 尚无 `packages/engine` |
| 表达式求值 | **未实现** | `docs/ir.md` 定义语法 |
| 数据 provider | 规范完成，宿主有内部快照 | `docs/providers.md`、`PanelSnapshot` |
| 声明式组件 | **未实现** | 内置组件仍是手写 React |
| 脚本沙箱 | **未实现** | `docs/scripts.md` 是目标 API |
| `.sill` 打包 / 安装 | **未实现** | `docs/roadmap.md` v0.4 / v0.5 |
| CLI | **未实现** | `sill validate/dev/pack/new` 都是计划 |
| 官方目录 | 已有索引与说明页 | `registry/catalog.json`、`widgets/` |
| 第三方组件安装 | **未开放** | 没有下载与安装通道 |

## 宿主 0.5.1 实际有什么

- 五张内置卡：`hero` / `system` / `processes` / `media` / `todo`。
- `WidgetShell` + `WIDGETS` 注册表，按 `layout.order` 渲染。
- 本仓库 **不** 是宿主实现；内置组件源码在 Sill 仓库。
- 内置组件拿到的是 React context，不是 `docs/runtime.md` 的 v1 API；两者不兼容。

## 兼容矩阵

| 组件声明 | 0.5.1 能加载吗 | 原因 |
|---|---|---|
| `runtime >=0.5.0`, `engine >=0.1.0` | 否 | 引擎不存在 |
| `runtime >=0.5.1`, `engine >=0.1.0` | 否 | 同上 |
| 只有 `runtime`（旧 manifest） | 否 | 缺少 `engine`，schema 已要求 |
| 内置组件（非 `.sill`） | 是 | 走注册表，不走 manifest |

`runtime` 与 `engine` 是两条线。0.5.1 满足大多数 `runtime`，但不满足任何 `engine`；
这是预期行为，不是 bug。

## 已验证

- `examples/clock`、`examples/counter` 通过 manifest schema。
- `examples/clock` 的 `layout.json` 通过 IR schema。
- `registry/catalog.json` 通过 catalog schema，五个 `docs` 路径存在。
- `python scripts/validate.py` 本地通过；CI 在 push 后运行同一份脚本。
- 五个内置组件的行为描述对照 0.5.1 源码核对过。

## 未验证 / 已知缺口

- 所有 IR 渲染、表达式、脚本 API 都还没有运行实现，只有规范与校验。
- 声明式 v1 没有输入、没有本地状态、没有逐行动作；todo / media 只能用脚本。
- 没有代码签名、没有下载通道、没有自动更新；`installable` 全是 `false`。
- `data.files` 被移除，等 opaque handle 方案。
- 五个内置组件的说明页基于 0.5.1 源码与 README，没有逐帧截图。
- Sill 主仓库的 `DEVPLAN.md` 仍写作 `runtime >=0.1.0`，尚未同步；以本仓库为准。

## 更新规则

- 状态变化时先改这份文件，再改相关文档。
- 不要在其他文档里写「已实现 / 计划中」的独立版本号；引用本文件。
- 打 tag 前确认「已验证」一节没有过期项。
