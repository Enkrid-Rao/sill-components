# Sill Components

Sill 的组件规范与官方组件目录。这个仓库主要说明：

- 第三方组件怎么写、能拿什么数据、不能做什么、怎么验证。
- 官方组件有哪些，源码在哪。

## 状态

Sill 0.5.4 有内置五张卡。开发分支（`main`）有模板渲染、动态布局和本地 `.sill` 安装。
正式 0.5.4 没有模板引擎和安装器；下面的 manifest 是当前格式，现在可以在开发分支本地安装，
但还不能通过官方目录分发。已实现部分见 [STATUS.md](STATUS.md)。

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

template 规则见 [docs/template.md](docs/template.md)。
web 规则见 [docs/web.md](docs/web.md)。

## Manifest

```json
{
  "schema": 1,
  "id": "sill.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.4",
  "engine": ">=0.1.0",
  "type": "template",
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/index.html"
}
```

完整字段见 [docs/manifest.md](docs/manifest.md)。

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

字段、单位、可空性见 [docs/providers.md](docs/providers.md)。template 不能自己读文件、注册表、进程或网络；
web 组件由 `trust` 决定能力。

## 约束

1. `<script>` 标签不执行（`innerHTML` 规则）；要 JS 写 `ui/main.js`。其余 HTML/CSS 不限，`on*`、`style`、`svg`、`img` 都可以。
2. template / sandboxed web 不能联网；trusted web 可以。
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

它们随 Sill 0.5.4 发布，是宿主内置实现，不是 `.sill` 包。目录见 [registry/README.md](registry/README.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [STATUS.md](STATUS.md) | 已实现 / 未实现 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更 |
| [docs/template.md](docs/template.md) | template 结构、HTML/CSS 规则、绑定、token |
| [docs/web.md](docs/web.md) | web 组件、trusted Node、沙箱、桥 |
| [docs/manifest.md](docs/manifest.md) | `widget.json` 字段、校验、权限 |
| [docs/runtime.md](docs/runtime.md) | 渲染、尺寸、主题、性能 |
| [docs/package.md](docs/package.md) | `.sill` 包结构、安装、卸载 |
| [docs/providers.md](docs/providers.md) | provider 字段与权限 |
| [docs/security.md](docs/security.md) | 信任模型、Shadow DOM、包边界 |
| [docs/testing.md](docs/testing.md) | 验收清单 |
| [docs/roadmap.md](docs/roadmap.md) | 后续计划 |
| [spec/widget.schema.json](spec/widget.schema.json) | manifest schema |
| [spec/catalog.schema.json](spec/catalog.schema.json) | 目录 schema |

## 开发

在 Sill 仓库里：

```bash
pnpm sill validate ./my-widget
pnpm sill pack ./my-widget -o my-widget.sill
pnpm sill new com.example.clock
pnpm sill dev ./my-widget
```

`pnpm sill` 只在 Sill 工作区可用，不是全局命令。CLI 源码在 `packages/cli`。

不用 CLI 时，仍可以跑规范仓库的校验：

```bash
python scripts/validate.py ./my-widget
```

不带参数时检查全仓库。

在 Sill 开发分支预览：

```powershell
$env:SILL_DEV_WIDGET = 'D:\Projects\Sill\examples\dev-widget'
pnpm dev
```

更快的方式：把组件文件夹直接放进 Skins 目录（Windows 是 `%APPDATA%\Sill\skins\`，
便携版在 `Sill-data\skins\`），保存即刷新，不需要打包或安装。设置 → 通用 → 组件文件夹
可以直接打开它。

安装本地 `.sill`：

1. 把 `widget.json`、`ui/index.html`、`ui/style.css`；web 再加 `ui/main.js` / `ui/assets/**`，压成 zip；
2. 把扩展名改成 `.sill`；
3. 设置 → 组件 → 安装组件…，确认 id / 版本 / 作者 / 权限后安装。

`SILL_DEV_WIDGET`、`pnpm sill` 和本地 `.sill` 安装只在当前开发分支可用。目录下载和正式发布还没做。

## 版本

- `schema` 固定 `1`。
- `runtime` 是宿主版本范围；`engine` 是模板引擎版本范围，两者都满足才加载。
- 破坏性变更升 `schema` 和 `engine` 主版本，并提供迁移器。
- 组件版本遵循 semver；宿主只按 `id` 识别组件。

## 许可

本仓库规范、目录和示例采用 MIT。组件作者可在 `widget.json` 的 `license` 字段另行声明。
