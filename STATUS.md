# 状态

这份文件是「现在到底有什么」的唯一真值。其他文档描述契约与目标，不重复状态数字。

最后核对：2026-11-19，对照 Sill `0.5.4` 与开发版 `0.6.0-dev.2`（`2a320f4`）。

## 版本

| 项 | 值 | 说明 |
|---|---|---|
| 正式宿主 | Sill 0.5.4 | 只有内置组件，没有模板引擎 / 安装器 |
| 开发宿主 | Sill `0.6.0-dev.2` | 模板 + 内联 JS、Skins、资源协议、组件存储、本地 `.sill` |
| 组件规范 | v0.4 | 本仓库 `main`；最后 tag 是 `v0.1.0` |
| manifest `schema` | 1 | 未变；必填字段收窄到 6 个 |
| 模板引擎目标版本 | 0.1.0 | 开发版可用，未打 tag |
| 目录 `schema` | 1 | `registry/catalog.json` |
| CLI | 0.3.0（npm `@heavenlydemon/sill-cli`） | 与新包结构一致 |

## 分层状态

| 层 | 状态 | 证据 / 位置 |
|---|---|---|
| manifest 校验 | 规范完成；Sill 开发分支安装器已接入基础校验 | `spec/widget.schema.json`、`scripts/validate.py`、Sill `main/widgets/package.ts` |
| 模板渲染 | **开发版可用** | Sill `TemplateWidget` + Shadow DOM，无标签白名单 |
| 内联 JS | **开发版可用** | `ui/main.js` 同页执行，`sill.data / onData / onDispose / command / storage / host` |
| 权威文档 | **已完成** | [docs/authoring.md](docs/authoring.md) |
| Skins 目录 | **开发版可用** | `<userData>/skins/<名字>/`，保存即重载该组件 |
| 组件存储 | **开发版可用** | `<userData>/widget-data/<id>.json` |
| 包内资源 | **开发版可用** | `sill-asset://<id>/ui/...`，相对路径自动改写 |
| 动态布局 id | **开发版可用** | `normalizeLayout(raw, knownIds)`；新组件自动补 box |
| 本地 `.sill` 安装 | **开发版可用** | 设置 → 组件 → 从 .sill 文件安装… / 双击 |
| 卸载 | **开发版可用** | 设置里的已安装列表 |
| CLI（new / validate / pack / dev） | **已发布 0.3.0** | `npm i -g @heavenlydemon/sill-cli`；源码在 `packages/cli` |
| Web 组件 | **开发版可用** | `type: "web"`；trusted 全 Node；sandboxed（隔离）走桥 + `sill.storage`，独立 partition |
| 组件升级 | **开发版可用** | 同 id 新版本覆盖旧目录，布局槽位保留 |
| 目录下载 / 更新 | **未实现** | 没有下载通道 |
| 权限确认 | **开发版可用** | 按能力档位提示（static / script / isolated / node），确认记入 `trust.json` |
| 签名 / 哈希 | **未实现** | 安装时只做静态校验 |
| 第三方组件分发 | **未开放** | 只能本地安装，不能从目录下载 |

## 当前能力

- 组件是 `widget.json` + `ui/index.html` + `ui/style.css`；
- 宿主把 HTML/CSS 原样挂到 Shadow DOM，放在 `WidgetShell` 的 `.card` 里；
- 可选 `ui/main.js` 在宿主页面内执行一次，拿 `sill.data / onData / command / storage`；
- 玻璃、圆角、atmosphere 由 `.card` / `.rail__atmo` 提供，模板只画内容；
- `<script>` 标签不执行（innerHTML 规则）；模板内容不做标签审查；
  支持 `data-sill-text` / `i18n` / `if` / `repeat` / `action` / `meter`；
- 包内资源走 `sill-asset://<id>/ui/...`，相对路径由宿主改写；
- `Skins` 目录：`<userData>/skins/<名字>/` 放进去即用，保存即刷新，不需要打包或安装；
- 本地 `.sill` 可以安装、隐藏、拖拽、跨列、卸载；
- 组件私有存储：`<userData>/widget-data/<id>.json`；
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

- `python scripts/validate.py` 本地通过；`examples/` 十个示例、catalog、fixtures 全部通过。
- CLI 0.3.0：`sill new` 生成的脚手架通过 `validate` 与 `pack`；`pack` 产物只含合法文件。
- Sill 开发版：`.sill` 安装、加载、卸载通过程序化测试；额外文件 / 路径穿越 / 缺 `ui/index.html`
  被拒绝；`ui/**` 任意文件可安装。
- 模板渲染：脚手架卡片在面板里正常显示；错误 `main.js` 显示卡内错误条。
- 热重载作用域：只改一个组件时，只有它重新执行（boot 计数 2 / 1）。
- 自由布局：`boxes:{}` 的 free 布局自动补种，数据晚到的卡片自动长高。
- 网络（临时放开 CSP 验证）：`fetch` 与远程图片在 `https:` 下可用；包内模块可 `import()`。
- `pnpm test`：安装器 + provider + 动作 + `.sill` 参数 + 信任档位 31 个测试通过；`verify.yml` 通过。
- 信任分级：主进程按包内容计算 static / script / isolated / node；`trust.json` 记住确认结果；
  设置里的组件列表显示档位（Playwright 核对）。

## 未验证 / 已知缺口

- 没有目录下载、自动更新。
- 安装时没有签名、哈希校验。
- 同一个 id 只保留一个版本；升级覆盖旧目录（布局槽位保留），没有版本回滚提示。
- 动作只有 `media.*` / `todo.toggle`；更多能力用 `main.js` + `sill.host`。
- 六个内置组件仍是 React 实现，没有迁到模板。

## 更新规则

- 状态变化时先改这份文件，再改相关文档。
- 不要在其他文档里写「已实现 / 计划中」的独立版本号；引用本文件。
- 打 tag 前确认「已验证」一节没有过期项。

