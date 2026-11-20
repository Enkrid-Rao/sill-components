# Changelog

## 官方组件 1.1.0 — 2026-11-20

五个可安装官方组件（`sill.clock` / `sill.calendar` / `sill.weather` / `sill.rings` / `sill.lyrics`）
按同一套视觉规范重做，打包产物升到 1.1.0，目录条目的 `version` / `download` / 描述同步更新。

### 新增

- [docs/design.md](docs/design.md)：组件视觉规范（字号、颜色、响应式、状态机、无障碍、发布自检）；
- `sill.clock` 设置：显示秒数 / 12 小时制 / 显示日期；时段文案进 `strings`，五档（凌晨 → 晚上）；
- `sill.calendar` 交互：上 / 下月与「今天」，固定六周网格，翻月动画与 `:focus-visible`；
- `sill.weather` 设置：°C / °F；双色昼夜图标；`loading` / `stale` / `error` 三种状态；
- `sill.rings` 每个环下方的「已用 / 总量」（CPU 显示核数）、无数据态、主题色环；
- `sill.lyrics` 七种状态、行进度线、偏移胶囊、重试按钮、10 分钟缓存与请求中止；
- `sill.weather` / `sill.lyrics` / `sill.clock` 的设置监听在 `onDispose` 里解绑。

### 修复

- `sill.weather`：`Number(null) === 0` 导致无数据时显示 `0° / 高 0° 低 0°`；现在显示 `--`；
- `sill.rings`：删掉 `#cpuPct` / `.rings__unit` 等不存在的选择器、`data-value` 死属性、
  直接写宿主 `.card` 内联样式的 `fit()`，改用纯 CSS 容器查询；
- `sill.rings`：不再写死蓝 / 琥珀 / 粉三组色相，四个环全部从 `--accent*` 派生；
- `sill.calendar`：中文周标题 8px / 英文单字母重复（S M T W T F S）改为可读的双字母与 10.5px 下限；
  今天的高亮不再在宽卡被拉成椭圆；翻月不再跳高度；
- `sill.lyrics`：`setInterval` 未清理、重复文案表、只显示两行纯歌词、请求无法中止等问题；
- `sill.clock`：宽卡不再把 318px 的排版横向拉长，改为「时间 + 日期/时段」两栏。

### 示例

- 统一改掉硬编码颜色（`rgba(250,255,252,.97)`、`hsl(36 …)`）与空标题行；
- `analog` 秒数解析改为 `new Date(iso)`；`media` / `wave` / `tasks` 补 hover / focus-visible；
- `clock` / `inline-clock` / `analog` / `wave` / `halo` 补 `container-type` 与 `clamp()` 字号。

## v0.4 — 未发布

把「模板」从静态白名单卡升级成 Rainmeter 式可信组件：去掉白名单、加内联 JS、组件存储、包内资源与 Skins 目录。

### 变更

- 删除 HTML/CSS 标签白名单与 sanitizer：`svg` / `img` / 内联 `style` / `on*` / `url()` 全部放开；
- `<script>` 标签仍不执行（innerHTML 规则）；`ui/main.js` 作为宿主页面脚本执行一次；
- 新增内联 JS API：`sill.data / onData / command / storage / host`，以及 `root`（shadow root）；
- 示例 `rings` 重做为一张卡里的四个独立圆环（CPU / GPU / RAM / SWAP，渐变 + 发光）；
- `clock` / `calendar` / `weather` / `rings` 迁入 `widgets/` 作为官方可安装模板（`sill.*`），
  应用仓库只保留 hero / system / processes / media / shelf / todo 六个初始组件；
- `halo` 增加 SWAP 圆环并统一命名（虚拟内存）；`analog` / `tasks` / `wave` 去掉组件名标题。
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
- 新增组件设置：`widget.json` 的 `settings` 由宿主渲染表单（text / number / switch / select），
  值存 `widget-settings/<id>.json`，组件用 `sill.settings` 读取、模板可用 `onChange`；
- 新增从 https 直链安装 .sill；组件目录（catalog.json）只读，`installable + download` 的条目可直接安装
- 组件更新：打开组件页时按目录版本对比已安装组件，显示「更新」并复用 URL 安装流程
- 升级改为覆盖式（upgrade-in-place）：同 id 新版本替换旧目录，布局槽位保留；
- web 的隔离模式补齐 `sill.storage` 与 `https:` 网络，每个组件独立 partition；
  `trust: "trusted"` 仍是唯一的 Node 插件通道。

### 官方组件

- 新增首个可安装官方模板 `sill.lyrics`（同步歌词，LRCLIB + 偏移设置），源码在 `widgets/sill.lyrics/`；
- 新增 `registry/packages/` 存放打包产物，目录条目 `download` 指向 raw 直链，validate 会检查文件存在；
- 官方组件目录 `widgets/<id>/` 纳入 validate（manifest / 模板 / 文件预算）。

### 内置组件

- system / processes 改为随应用发布的模板包（esources/builtin-widgets/），与第三方模板同一路径；
- 后台每 6 小时检查目录并对比已安装版本，有更新时面板设置按钮显示小圆点（不自动安装）。

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
- CLI 0.3.1：`sill new` 生成完整脚手架（index/style/main/README/sill.d.ts），
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










