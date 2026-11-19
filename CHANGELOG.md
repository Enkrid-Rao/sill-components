# Changelog

## v0.4 — 未发布

把「模板」从静态白名单卡升级成 Rainmeter 式可信组件：去掉白名单、加内联 JS、组件存储、包内资源与 Skins 目录。

### 变更

- 删除 HTML/CSS 标签白名单与 sanitizer：`svg` / `img` / 内联 `style` / `on*` / `url()` 全部放开；
- `<script>` 标签仍不执行（innerHTML 规则）；`ui/main.js` 作为宿主页面脚本执行一次；
- 新增内联 JS API：`sill.data / onData / command / storage / host`，以及 `root`（shadow root）；
- 新增组件私有存储：`<userData>/widget-data/<id>.json`；
- 新增包内资源协议 `sill-asset://<id>/ui/...`，`<img src="assets/x.png">` 与 `url(bg.png)` 自动改写；
- 新增 Skins 目录：`<userData>/skins/<名字>/` 丢进去即用、保存即刷新，无需打包安装；
- 安装版注册当前用户级 `.sill` 关联，双击 / 右键 → Install with Sill 走同一套确认流程；
  绿色版可在设置里手动注册 / 取消；
- template 现在也允许 `ui/main.js` 与 `ui/assets/**`；
- 数据更新改为增量（只改绑定节点），CSS 过渡跨采样继续；
- 安全模型改为 Rainmeter 式信任模型（见 [docs/security.md](docs/security.md)）。

### 分发与信任

- 安装提示按包内容算出的能力档位（static / script / isolated / node）：纯静态组件直接安装；
- `<userData>/trust.json` 记住确认结果，同一组件能力不变时不再询问，能力升级才重新提示；
- 设置里显示每个组件的能力档位（静态 / 脚本 / 隔离 / 完整 Node）；
- 升级改为覆盖式（upgrade-in-place）：同 id 新版本替换旧目录，布局槽位保留；
- web 的隔离模式补齐 `sill.storage` 与 `https:` 网络，每个组件独立 partition；
  `trust: "trusted"` 仍是唯一的 Node 插件通道。

### 开发者体验

- 新增权威文档 [docs/authoring.md](docs/authoring.md)：文件结构、API、token、数据源、配方、
  常见坑、给 AI 的检查清单；
- manifest 放宽：`author` / `license` / `runtime` / `engine` / `permissions` / `span` 改为可选；
  `id` 支持单段（`clock`）；`version` 支持 `+build`；
- 包结构放宽为「根目录元数据 + `ui/**` 任意文件」，可以拆 `lib/`、`data/`、`fonts/`；
  `ui/style.css` 不再必需，`ui/index.html` 成为唯一必需入口；
- `ui/main.js` 新增 `sill.onDispose`，同步异常在卡内显示错误条；
- 热重载只重建内容变化的组件（payload 按内容比较）；
- CSP 放开 `https:`（fetch / 图片 / 字体 / 音视频）与 `sill-asset:` 模块，组件可以联网、拆多文件；
- CLI 0.3.0：`sill new` 生成完整脚手架（index/style/main/README/sill.d.ts），
  `validate` / `pack` 与新规则对齐。

## v0.3 — 未发布

这一版把组件模型从 JSON IR / iframe 换成 **template**。

### 变更

- 组件 = `widget.json` + `ui/index.html` + `ui/style.css`；
- 模板直接渲染进 `WidgetShell` 的 `.card`（Shadow DOM），玻璃和 atmosphere 原生复用；
- 删除 `declarative` / `script` 类型、IR 节点、脚本沙箱和 iframe 相关契约；
- 只读数据用 `data-sill-text`；v1 不执行 JS、不联网、不写数据；
- 权限只保留 `data.time/system/media/weather/todo`；
- 校验器重写：manifest、HTML 白名单、CSS 限制、包大小；
- 新增 `.sill` 包规范：三个文件、原子安装、卸载、无签名 / 无目录下载；
- 示例改为 template clock，删除 counter。

### 删除

- `docs/ir.md`、`docs/scripts.md`
- `spec/layout.schema.json`、`spec/commands.json`
- `examples/counter`
- 旧 IR / script fixtures

## v0.2 — 2026-11

- 修正尺寸、网络、engine 契约；
- 增加 provider / 命令目录、目录 schema、官方组件目录、校验脚本与 CI。

## v0.1.0 — 2026-11

首个规范版本：manifest / IR / runtime / script / security / testing / roadmap。
