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
