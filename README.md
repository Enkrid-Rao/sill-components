# Sill Components

Sill 的组件规范与官方组件目录。这个仓库主要说明：

- 第三方组件怎么写、能拿什么数据、不能做什么、怎么验证。
- 官方组件有哪些，源码在哪。

**写组件从这里开始：[docs/authoring.md](docs/authoring.md)** —— 一份文档讲完文件结构、
`widget.json`、`sill` API、主题变量、数据源、配方、常见坑和给 AI 的检查清单。

## 状态

Sill **0.6.0** 起组件平台进入稳定版：模板同页运行（可选 `ui/main.js`）、Skins 目录热重载、
`sill-asset://` 资源、`sill.storage` 组件存储、组件设置、`.sill` / URL / 目录安装与更新。
官方组件见 [widgets/](widgets/) 与 [registry/](registry/)。

## 组件格式

组件只写卡片内容。玻璃、圆角、边框、padding、atmosphere 由 `WidgetShell` 的 `.card` 提供。

```text
my-widget/
├─ widget.json
└─ ui/
   ├─ index.html
   ├─ style.css
   ├─ main.js        # optional（template / web 都可以有）
   └─ assets/        # optional
```

- `type` 为 `template` 或 `web`。
- template 挂在宿主页面的 Shadow DOM 里；`ui/main.js` 可选，同页执行（Rainmeter 的 Lua 式）。
- web 在独立 webview 里执行 JS；`trust: "trusted"` 有完整 Node，默认 `sandboxed` 只走桥。
- template 的 HTML 原样放进 Shadow DOM（不做标签审查）。
- 图片 / 字体放 `ui/assets/`，用相对路径引用，宿主会改写到 `sill-asset://`。
- 组件不要给卡片铺背景。

template / web 规则见 [docs/authoring.md](docs/authoring.md) 与 [docs/web.md](docs/web.md)。
web 规则见 [docs/web.md](docs/web.md)。

## Manifest

最小可用：

```json
{
  "schema": 1,
  "id": "clock",
  "name": "Clock",
  "version": "1.0.0",
  "type": "template",
  "ui": "ui/index.html"
}
```

带数据绑定与文案：

```json
{
  "schema": 1,
  "id": "com.you.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "you",
  "type": "template",
  "size": { "w": 384, "h": 190 },
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "strings": { "en": { "title": "LOCAL TIME" }, "zh": { "title": "本地时间" } },
  "ui": "ui/index.html"
}
```

`license` / `runtime` / `engine` / `permissions` / `author` 都是可选的。完整字段见
[docs/manifest.md](docs/manifest.md)。

## 模板

`ui/index.html`：

```html
<div class="clock">
  <div class="clock__time" data-sill-text="now.time">--:--</div>
  <div class="clock__date" data-sill-text="now.dateLabel"></div>
</div>
```

`ui/style.css`：

```css
:host { display: block; }

.clock__time {
  font-family: var(--serif);
  font-size: 56px;
  color: rgba(250, 255, 252, 0.97);
}

.clock__date {
  color: var(--ink-dim);
}
```

完整示例见 [examples/clock](examples/clock)。

## 数据

模板只能读 manifest 声明的 provider：

- `time.now`
- `system.cpu` / `system.memory` / `system.gpu` / `system.network` / `system.processes`
- `media.nowPlaying`
- `weather.current`
- `todo.list`

字段、单位、可空性见 [docs/providers.md](docs/providers.md)。template 可以 `fetch` https
接口、加载远程图片/字体，但读不了本地文件（除非用 `sill.host` 的宿主 API）；web 组件由
`trust` 决定能力。

## 约束

1. `<script>` 标签不执行（`innerHTML` 规则）；要 JS 写 `ui/main.js`。其余 HTML/CSS 不限，`on*`、`style`、`svg`、`img` 都可以。
2. 网络：`https:` 的 `fetch`、图片、字体、音视频都允许；不允许加载远程脚本。
3. 不能主动把窗口抢到前台。
4. 中文小字不低于 10.5px；正文 13.5–14px。
5. 卡片内容宽约 185–1110px；320–1180 是面板宽。
6. 用宿主 CSS 变量，不写死主题色，不用 `backdrop-filter`。

## 官方组件

| id | 名称 | 类型 | 数据 | 可安装 |
|---|---|---|---|---|
| `sill.hero` | 头图 | builtin | 时间、天气 | 否 |
| `sill.system` | 系统 | builtin | CPU / 内存 / GPU / 网络 | 否 |
| `sill.processes` | 进程 | builtin | 进程、显存 | 否 |
| `sill.shelf` | 收纳 | builtin | 快捷方式 | 否 |
| `sill.media` | 媒体 | builtin | SMTC、音量 | 否 |
| `sill.todo` | 待办 | builtin | 待办 | 否 |
| [`sill.lyrics`](widgets/sill.lyrics/README.md) | 歌词 | template | 正在播放、LRCLIB | **是** |

`hero / media / shelf / todo` 仍是宿主内置实现；`system` / `processes` 已改成随应用发布的模板包。
`lyrics` 是第一个从本仓库分发的可安装官方组件：源码在 `widgets/sill.lyrics/`，打包产物在
`registry/packages/`，目录条目用 `installable: true` + `download` + `sha256` 指向 raw 直链；
宿主安装前会校验包 hash，不匹配拒绝安装。

五个可安装组件（`lyrics` / `clock` / `calendar` / `weather` / `rings`）统一了视觉规范；`lyrics` / `clock` / `rings` 已到 1.1.1，`calendar` / `weather` 为 1.1.0：
衬线斜体主值、`--accent-2` / `--accent-pale` 派生色、185–1110px 的容器查询布局、完整的状态与焦点样式。
规范见 [docs/design.md](docs/design.md)。

目录见 [registry/README.md](registry/README.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [docs/authoring.md](docs/authoring.md) | **写组件的完整指南**（从这里开始） |
| [docs/design.md](docs/design.md) | **组件视觉规范**：字号、颜色、响应式、状态机、自检清单 |
| [STATUS.md](STATUS.md) | 已实现 / 未实现 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更 |
| [docs/runtime.md](docs/runtime.md) | 渲染、尺寸、主题、性能 |
| [docs/package.md](docs/package.md) | `.sill` 包结构、安装、卸载 |
| [docs/manifest.md](docs/manifest.md) | `widget.json` 字段、校验、权限 |
| [docs/providers.md](docs/providers.md) | provider 字段与权限 |
| [docs/web.md](docs/web.md) | web 组件、trusted Node、沙箱、桥 |
| [docs/security.md](docs/security.md) | 信任模型、包边界 |
| [docs/testing.md](docs/testing.md) | 验收清单 |
| [docs/roadmap.md](docs/roadmap.md) | 后续计划 |
| [spec/widget.schema.json](spec/widget.schema.json) | manifest schema |
| [spec/catalog.schema.json](spec/catalog.schema.json) | 目录 schema |

## 开发

**最快的循环不需要任何工具**：把组件文件夹放进 Skins 目录
（`%APPDATA%\Sill\skins\`，便携版 `Sill-data\skins\`），Sill → 设置 → 组件 →
打开组件文件夹，勾选显示；保存文件即热重载（只重载改动的那个组件）。面板上按 `F12`
看 console，`main.js` 抛错会在卡片里显示错误条。

CLI（可选）：

```bash
npm i -g @heavenlydemon/sill-cli   # 0.3.1（已发布）
sill new clock
sill validate ./clock
sill pack ./clock -o clock.sill
```

在 Sill 仓库里也可以用工作区版本：`pnpm sill new / validate / pack / dev`。

规范仓库的自检：

```bash
python scripts/validate.py ./my-widget
```

不带参数时检查全仓库。

旧的文件夹预览方式（仍然可用）：

```powershell
$env:SILL_DEV_WIDGET = 'D:\Projects\Sill\examples\dev-widget'
pnpm dev
```

安装本地 `.sill`：

1. 把 `widget.json` + `ui/**`（可选 `README.md` / `LICENSE`）压成 zip；
2. 把扩展名改成 `.sill`；
3. 设置 → 组件 → 从 .sill 文件安装…，或者直接双击。

也可以从 https 直链安装，或从 `registry/catalog.json` 的组件目录里点安装；签名还没做。

## 版本

- `schema` 固定 `1`。
- `runtime` / `engine` 是可选的兼容性元数据，现在不做加载期强制。
- 破坏性变更升 `schema` 和 `engine` 主版本，并提供迁移器。
- 组件版本遵循 semver；宿主按 `id` 识别组件，同 id 只能装一个版本。

## 许可

本仓库规范、目录和示例采用 MIT。组件作者可在 `widget.json` 的 `license` 字段另行声明。



