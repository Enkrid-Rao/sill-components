# 状态

这份文件是「现在到底有什么」的唯一真值。其他文档描述契约与目标，不重复状态数字。

最后核对：2026-11-18，对照 Sill `0.5.4`。

## 版本

| 项 | 值 | 说明 |
|---|---|---|
| 宿主 Sill | 0.5.4 | `package.json` |
| 组件规范 | v0.3（未打 tag） | 本文档所在仓库；最后 tag 是 `v0.1.0` |
| manifest `schema` | 1 | 未变 |
| 模板引擎目标版本 | 0.1.0 | 只在开发分支原型 |
| 目录 `schema` | 1 | `registry/catalog.json` |

## 分层状态

| 层 | 状态 | 证据 / 位置 |
|---|---|---|
| manifest 校验 | 规范完成，宿主未接入安装器 | `spec/widget.schema.json`、`scripts/validate.py` |
| 模板渲染 | **开发分支原型** | Sill `DevWidgetCard` + `SILL_DEV_WIDGET` |
| 动态布局 id | **未实现** | `CARD_IDS` 仍写死五张 |
| `.sill` 打包 / 安装 | **未实现** | 没有 zip、没有安装器 |
| CLI | **未实现** | `sill validate/dev/pack/new` 都是计划 |
| 官方目录 | 已有索引与说明页 | `registry/catalog.json`、`widgets/` |
| 第三方组件安装 | **未开放** | 没有下载与安装通道 |

## 当前模板模型

- 第三方组件是 `widget.json` + `ui/index.html` + `ui/style.css`；
- 宿主清洗 HTML/CSS 后挂到 Shadow DOM，放在 `WidgetShell` 的 `.card` 里；
- 玻璃、圆角、atmosphere 由 `.card` / `.rail__atmo` 提供，模板只画内容；
- v1 不执行 JS、不联网、不写数据；只有 `data-sill-text` 文本绑定；
- 开发预览只通过 `SILL_DEV_WIDGET`，不是可安装的 `.sill`。

## 兼容矩阵

| 组件声明 | 0.5.4 能加载吗 | 原因 |
|---|---|---|
| `runtime >=0.5.4`, `engine >=0.1.0`, `type: template` | 否，除非开发分支 + 环境变量 | 模板引擎/安装器未发布 |
| 旧 `type: declarative` / `script` | 否 | v0.3 已移除 |
| 内置组件（非 `.sill`） | 是 | 走注册表，不走 manifest |

## 已验证

- `examples/clock` 通过 manifest schema 与模板校验。
- `registry/catalog.json` 通过 catalog schema，五个 `docs` 路径存在。
- `python scripts/validate.py` 本地通过。
- Sill 开发分支的模板原型在默认 / Lagoon / 320 宽下截图核对过（本地提交，未推送）。

## 未验证 / 已知缺口

- 没有安装器、动态布局 id、权限面板、卸载流程。
- 模板只有文本绑定；没有循环、条件、动作、i18n。
- sanitizer 是 v1 白名单，还没有完整安全测试集。
- 五个内置组件仍是 React 实现，没有迁到模板。
- 旧 v0.1/v0.2 的 JSON IR / iframe 文档已删除；历史在 git 里。

## 更新规则

- 状态变化时先改这份文件，再改相关文档。
- 不要在其他文档里写「已实现 / 计划中」的独立版本号；引用本文件。
- 打 tag 前确认「已验证」一节没有过期项。
