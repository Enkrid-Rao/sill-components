# Web 组件

`type: "web"` 是带独立 webview 的组件，跑在自己的 guest 里。玻璃和 atmosphere 由宿主 `.card`
提供，guest 透明。

大多数卡片不需要它：`type: "template"` 也支持 `ui/main.js`，同页执行、没有独立进程、
没有固定高度。只有需要独立渲染进程、完整 Node 或强隔离时才用 `web`。

## 两种信任级别

| `trust` | JS | Node / Win32 | 用途 |
|---|---|---|---|
| `sandboxed`（默认） | 是 | 否，只走 `window.sill` | 市场、不可信代码 |
| `trusted` | 是 | **完整 Node** | 本地、自己写、审核过的插件 |

trusted 组件能 `require('node:fs')`、`child_process`、native addon、Windows API。它不是沙箱；
安装时必须显示完全信任警告，不能进 sandboxed 市场。

## 包结构

```text
my-web/
├─ widget.json
└─ ui/
   ├─ index.html
   ├─ style.css
   ├─ main.js
   └─ assets/          # optional helper / icons / fonts
```

- `type` 为 `web`；
- `ui` 固定 `ui/index.html`；
- `size.h` 是 webview 的初始高度；guest 会按内容上报高度，宿主据此自适应。
- `trust` 可选，默认 `sandboxed`；
- 可以带 `ui/assets/**`；trusted 组件通过 `sill.ready(({ dir }) => ...)` 拿包目录。

## manifest

```json
{
  "schema": 1,
  "id": "com.example.webclock",
  "name": "Web Clock",
  "version": "1.0.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.4",
  "engine": ">=0.1.0",
  "type": "web",
  "trust": "trusted",
  "size": { "w": 384, "h": 160 },
  "span": { "default": 1 },
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/index.html"
}
```

## JS

```js
const os = require('node:os')

document.querySelector('#host').textContent = os.hostname()

sill.ready(({ data, dir }) => {
  document.querySelector('#time').textContent = data.now?.time ?? '--:--'
})
```

sandboxed 组件不能用 `require`，但可以用：

```js
sill.ready(({ data, language }) => { ... })
sill.onData(({ data, language }) => { ... })
sill.command('media.playpause')
```

- 宿主把 manifest `data[].id` 解析成 `data`；
- CSS token 以 CSS 变量注入 guest `<html>`；
- `command` 仍走动作白名单和权限；
- sandboxed 没有 Node、`fs`、网络。

## 安全边界

- 主进程 `will-attach-webview` 只接受 `data:text/html`；
- 宿主设置 `partition`，sandboxed 强制 `contextIsolation` / `sandbox` / 无 Node；
- trusted 用 `sill-trusted` partition，主进程才启用 Node；
- guest 的 CSP 禁止远程资源；
- trusted 组件全权限，安全由用户选择安装什么来保证。

## 打包与安装

`.sill` 根目录：

```text
widget.json
ui/index.html
ui/style.css
ui/main.js
```

Sill 开发分支的安装器支持 `type: "web"`，安装前显示类型 / 信任级别；trusted 需要明确确认。

## 限制

- sandboxed assets 还没有自定义协议；trusted 可以直接读包目录；
- 没有 `sill.fetch` / `sill.storage`；
- 没有目录下载 / 自动更新；
- Electron `<webview>` 已标记 deprecated，后续换 `WebContentsView`。
