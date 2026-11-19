# Web 组件

`type: "web"` 是带独立 webview 的组件，跑在自己的 guest 里。玻璃和 atmosphere 由宿主 `.card`
提供，guest 透明。

大多数卡片不需要它：`type: "template"` 也支持 `ui/main.js`，同页执行、没有独立进程、
没有固定高度。只有需要独立渲染进程、完整 Node 或强隔离时才用 `web`。

## 两种模式

| `trust` | 运行方式 | 能力 | 用途 |
|---|---|---|---|
| `sandboxed`（默认，即“隔离”） | 独立 guest，每个组件一个 partition | 桥：`data / command / storage`，无 Node | 第三方 UI、重前端但不需要系统能力 |
| `trusted`（即“Node 插件”） | 独立 guest | **完整 Node / Win32** | 本地插件、native helper |

隔离模式没有 `require`，但可以联网、取远程图片、用 `sill.storage` 存自己的数据；它拿不到
宿主 DOM，也看不到别的组件。trusted 组件能 `require('node:fs')`、`child_process`、native addon、
Windows API，安装时必须勾选确认。

## 包结构

```text
my-web/
├─ widget.json
└─ ui/
   ├─ index.html
   ├─ style.css
   ├─ main.js
   └─ **               # 任意文件：assets / lib / data
```

- `type` 为 `web`；`ui` 固定 `ui/index.html`；`ui/main.js` 必需；
- `size.h` 是 webview 的初始高度；guest 会按内容上报高度，宿主据此自适应；
- `trust` 可选，默认 `sandboxed`；
- `ui/` 下的相对路径会被 `<base>` 指到 `sill-asset://<id>/ui/`，图片/字体直接写相对路径；
- trusted 组件通过 `sill.ready(({ dir }) => ...)` 拿包目录。

## manifest

```json
{
  "schema": 1,
  "id": "com.example.webclock",
  "name": "Web Clock",
  "version": "1.0.0",
  "author": "you",
  "type": "web",
  "trust": "trusted",
  "size": { "w": 384, "h": 160 },
  "span": { "default": 1 },
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/index.html"
}
```

`author` / `license` / `runtime` / `engine` / `permissions` 都是可选的。

## JS

```js
const os = require('node:os') // 只有 trust: "trusted" 能用

document.querySelector('#host').textContent = os.hostname()

sill.ready(({ data, dir }) => {
  document.querySelector('#time').textContent = data.now?.time ?? '--:--'
})
```

隔离模式不能用 `require`，但可以用：

```js
sill.ready(({ data, language }) => { ... })
sill.onData(({ data, language }) => { ... })
sill.command('media.playpause')
sill.storage.get().then((saved) => { ... })
sill.storage.patch({ lastPlayed: Date.now() })
sill.settings.get().then((values) => { ... })
```

- 宿主把 manifest `data[].id` 解析成 `data`；
- CSS token 以 CSS 变量注入 guest `<html>`；
- `command` 仍走动作白名单和权限；
- `sill.storage` 落在 `<userData>/widget-data/<id>.json`，不依赖 guest 的 localStorage；
- 联网：`https:` 的 fetch / 图片 / 字体 / 音视频都允许；不允许加载远程脚本。

## 安全边界

- 主进程 `will-attach-webview` 只接受 `data:text/html`，并强制注入组件 preload；
- 宿主设置 `partition`：隔离模式每个组件一个 `sill-widget-<id>`，trusted 用 `sill-trusted`；
- 隔离模式由主进程强制 `contextIsolation` / `sandbox` / 无 Node；
- guest 的 CSP 禁止远程脚本，但允许 `https:` 的数据与包内模块；
- trusted 组件全权限，安全由用户选择安装什么来保证（安装时按能力档位提示）。

## 打包与安装

`.sill` 根目录：`widget.json` + `ui/**`（`ui/index.html`、`ui/main.js` 必需）。

安装器支持 `type: "web"`；隔离模式按 `isolated` 档提示，`trust: "trusted"` 按 `node` 档提示并
需要勾选确认。

## 限制

- 没有 `sill.fetch`（用浏览器 `fetch`；需要绕 CORS 时再讨论宿主代理）；
- 没有自动安装更新；URL / 目录安装与更新提示已可用；
- Electron `<webview>` 已标记 deprecated，后续换 `WebContentsView`。
