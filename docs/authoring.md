# 写一个 Sill 组件

> 这是组件开发的唯一权威文档。你只需要会 **HTML / CSS / JavaScript**，
> 不需要学模板语言、IR、构建工具或任何新的 DSL。读完这一页就能写出可用的组件；
> 目标是 5 分钟出第一张卡，并且让 AI 读完这一页就能直接产出完整、好看的组件。

## 1. 30 秒模型

一个组件就是一个文件夹：

```text
clock/
├─ widget.json      # 元数据：id、名字、绑定的数据、尺寸
└─ ui/
   ├─ index.html    # 结构：普通 HTML，直接挂在卡片的 Shadow DOM 里
   ├─ style.css     # 样式：普通 CSS，可用宿主主题变量
   ├─ main.js       # 可选：普通 JS，在面板页面里执行一次
   ├─ sill.d.ts     # 可选：编辑器补全
   └─ assets/**     # 可选：图片、字体、音频…相对路径直接用
```

宿主负责玻璃、圆角、阴影、主题色；你只画卡片**内容**。

两种运行方式，按需选：

| type | 怎么跑 | 适合 |
|---|---|---|
| `template`（默认） | HTML/CSS 挂进卡片的 Shadow DOM；`main.js` 在面板页面里执行一次 | 绝大多数组件 |
| `web` | 独立 webview guest；`trust: "trusted"` 时还能用 Node | 要跑 React/Three 等重前端、或需要 Node 的插件 |

> 组件是**本地可信代码**：安装或放进 skins 目录就是授权。宿主不做运行时权限拦截，
> 只做「防手滑」的文件与路径检查。详见 [security.md](security.md)。

## 2. 三分钟做出第一个组件（不用任何工具）

1. 打开 Sill → 设置 → 组件 → **新建组件…**：它在组件文件夹里生成一个能跑的脚手架并直接打开。
   也可以点 **打开组件文件夹**（默认 `%APPDATA%\Sill\skins\`，便携版是 `Sill-data\skins\`）
   自己建：
2. 在里面新建一个文件夹，比如 `hello/`，写三个文件：

`hello/widget.json`

```json
{
  "schema": 1,
  "id": "hello",
  "name": "Hello",
  "version": "1.0.0",
  "type": "template",
  "ui": "ui/index.html"
}
```

`hello/ui/index.html`

```html
<div class="hello">
  <span class="hello__label">HELLO</span>
  <strong class="hello__big" id="big">Sill</strong>
</div>
```

`hello/ui/style.css`

```css
:host { display: block; }
.hello { display: flex; flex-direction: column; gap: 6px; color: var(--ink); }
.hello__label { color: var(--ink-faint); font-size: 10px; letter-spacing: .18em; }
.hello__big { font-family: var(--serif); font-style: italic; font-size: 40px; line-height: 1; }
```

3. 保存。组件立刻出现在 Sill 的组件列表里（设置 → 组件 → 显示）。勾上它，卡片就出现了。

改文件 → 保存 → 卡片自动刷新，**只重载你改的这个组件**。

## 3. widget.json 参考

最小可用（只有这些是必需的）：

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

完整字段：

| 字段 | 必需 | 说明 |
|---|---|---|
| `schema` | ✔ | 固定 `1` |
| `id` | ✔ | 全局唯一。小写字母/数字/`.`/`-`/`_`，2–64 字符，如 `clock`、`com.you.clock` |
| `name` | ✔ | 显示名，最长 40 字符（超出截断） |
| `version` | ✔ | semver，如 `1.0.0`、`1.2.0-beta.1`、`1.0.0+build.7` |
| `type` | ✔ | `"template"` 或 `"web"` |
| `ui` | ✔ | 固定 `"ui/index.html"` |
| `author` |  | 作者，缺省 `unknown` |
| `license` |  | 缺省 `UNLICENSED`；只用于展示与分发 |
| `description` |  | 一句话说明，展示在安装/组件列表 |
| `size` |  | `{ "w": 384, "h": 190 }`；`h` 是 web 组件的固定高度，template 由内容决定 |
| `span` |  | `{ "default": 1 }`（1–3 列）；缺省 1。用户布局优先 |
| `permissions` |  | 数组，只用于安装提示里说明「它读什么」，不做运行时拦截 |
| `data` |  | 数据绑定，见第 5 节；最多 16 条 |
| `strings` |  | 文案表，`{ "en": {...}, "zh": {...} }`，最大 160 字符/条 |
| `trust` |  | 仅 `type: "web"`：`"trusted"`（有 Node）或 `"sandboxed"`（无 Node） |

完整示例：

```json
{
  "schema": 1,
  "id": "com.you.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "you",
  "description": "Local time and date",
  "type": "template",
  "size": { "w": 384, "h": 190 },
  "span": { "default": 1 },
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "strings": { "en": { "title": "LOCAL TIME" }, "zh": { "title": "本地时间" } },
  "ui": "ui/index.html"
}
```

## 4. 文件规则（只有一条）

`widget.json` 在根目录，**其它文件都放在 `ui/` 下**。根目录只额外允许
`README.md`、`LICENSE`、`LICENSE.txt`、`NOTICE`。

- `ui/index.html` 必需；`ui/style.css`、`ui/main.js` 可选（`type: "web"` 必须有 `main.js`）；
- `ui/` 下可以随便建目录：`ui/lib/`、`ui/data/`、`ui/assets/`、`ui/fonts/` 都行；
- 打包时单个文件 ≤ 20 MB，整包 ≤ 50 MB，文件数 ≤ 500；
- 不要放 `node_modules`、`.git`、`dist`。

## 5. 数据：manifest 绑定 + 页面指令

在 `widget.json` 里声明你要哪几份数据，每份起一个短 id：

```json
"data": [
  { "id": "now", "source": "time.now" },
  { "id": "cpu", "source": "system.cpu" }
]
```

然后在 HTML 里用 `data-sill-*` 指令（不写一行 JS 也能显示）：

```html
<span data-sill-text="now.time"></span>          <!-- 文本 -->
<span data-sill-i18n="title"></span>              <!-- 多语言 -->
<div data-sill-if="cpu.usage"></div>              <!-- 有值才显示 -->
<div data-sill-if="!media.active"></div>          <!-- 取反 -->
<div data-sill-repeat="todos">                    <!-- 列表 -->
  <span data-sill-text="item.text"></span>
</div>
<button data-sill-action="media.playpause">▶</button>
<div class="bar"><i data-sill-meter="cpu.usage"></i></div>  <!-- 写 --sill-value: 0–100 -->
```

指令速查：

| 属性 | 取值 | 行为 |
|---|---|---|
| `data-sill-text` | 路径 | 写入 `textContent`；数字保留 1 位小数；`null/undefined/对象` → `—` |
| `data-sill-i18n` | key | `strings[当前语言][key]` → 回落 `strings.en[key]` → 回落 key 本身 |
| `data-sill-if` | 路径 / `!路径` | 只判断真假；假时加 `hidden`。**不支持 `>`、`===` 等表达式** |
| `data-sill-repeat` | 路径（数组） | 每项克隆一份；内部用 `item` / `item.xxx`；按 `item.id` 或下标复用行 |
| `data-sill-action` | 见下 | 点击触发；需要对应 `permissions` |
| `data-sill-action-arg` | 路径 | 传给动作的参数（`todo.toggle` 用 item.id） |
| `data-sill-meter` | 路径 | 把 0–100 写到元素的 CSS 变量 `--sill-value` |

可用动作：`media.playpause`、`media.next`、`media.prev`、`media.mute`、`todo.toggle`
（需要 `action.media` / `action.todo`）。要更多能力就在 `main.js` 里写。

> 指令只做简单的事。想要比较、格式化、拼字符串，用 `main.js` 写普通 JS，别猜 DSL。

## 6. 数据源（provider）一览

| source | 字段 |
|---|---|
| `time.now` | `time` `date` `dateLabel` `iso` `epoch` `tz` `weekday` `hour` `minute` |
| `system.cpu` | `usage` `cores` |
| `system.memory` | `percent` `usedGb` `totalGb` |
| `system.gpu` | `usage` `memMb` `totalMb`（无独显时 `null`） |
| `system.network` | `downBps` `upBps` |
| `system.processes` | `topRam[{name,mb}]` `gpuMemMb` `gpuTotalMb` |
| `media.nowPlaying` | `active` `title` `artist` `album` `status` `position` `duration` `progress` `volume` `muted` `app` |
| `weather.current` | `temp` `high` `low` `code` `condition` `cityName` `stale` `error` |
| `todo.list` | 数组 `{ id, text, done }` |
| `host.state` | 上面所有东西：`time.*` + `language` + `snapshot` + `todos` + `media` + `weather` |

`host.state` 是「一次拿全」的偷懒选项：只声明一条，就能在 JS 里读整份快照。

```json
"data": [{ "id": "h", "source": "host.state" }]
```

```js
sill.onData(({ data }) => {
  const cpu = data.h?.snapshot?.cpu
  const todos = data.h?.todos ?? []
})
```

## 7. ui/style.css：主题变量与视觉基线

组件继承宿主的 CSS 变量，主题切换自动跟随，**不要自己写死颜色**：

| 变量 | 用途 |
|---|---|
| `--ink` / `--ink-soft` / `--ink-dim` / `--ink-faint` | 文字四级：主文、次文、说明、最弱 |
| `--accent` / `--accent-pale` / `--accent-soft` / `--accent-ink` / `--accent-glow` | 强调色与它的底/字/光 |
| `--accent-2` / `--mint` / `--apricot` | 辅助色（少用） |
| `--sans` / `--serif` | 字体栈：正文用 sans，大数字/标题用 serif |
| `--radius` / `--radius-card` | 面板圆角 34px / 卡片圆角 18px |
| `--ease-out` / `--ease-soft` | 缓动曲线 |

视觉基线（宿主内置卡就是这套，照着写就不会难看）：

```css
:host { display: block; }
/* 卡片自带 13px×14px 内边距，不要再套一层大 padding */
.wrap { display: flex; flex-direction: column; gap: 10px; color: var(--ink); }

/* 字号阶梯：10 眉标 / 11 辅助 / 12.5 正文 / 13.5 强调 / 46+ 主数字 */
.eyebrow { color: var(--ink-faint); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
.body    { color: var(--ink-soft); font-size: 12.5px; line-height: 1.5; }
.muted   { color: var(--ink-dim); font-size: 11px; }
.hero    { font-family: var(--serif); font-style: italic; font-size: 46px; line-height: 1;
           font-variant-numeric: tabular-nums; letter-spacing: -.02em; }

/* 分隔线、按钮、进度 */
.divider { border-top: 1px solid rgba(255,255,255,.08); }
.pill { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
        color: var(--ink-soft); border-radius: 999px; padding: 3px 10px;
        font: inherit; font-size: 11px; cursor: pointer;
        transition: background 160ms var(--ease-out), color 160ms var(--ease-out); }
.pill:hover { background: var(--accent-soft); color: var(--accent-ink); }
.bar { height: 3px; border-radius: 999px; background: rgba(255,255,255,.1); }
.bar > i { display: block; height: 100%; border-radius: inherit; background: var(--accent);
           width: calc(var(--sill-value, 0) * 1%); transition: width 420ms var(--ease-out); }
```

规则：

- **不要 `backdrop-filter`**，也不要在卡片里再铺一层玻璃/渐变——玻璃是 `.card` 的；
- 数字用 `font-variant-numeric: tabular-nums`，否则跳秒会抖；
- 卡片最窄约 185px、最宽约 1110px；用 flex / `minmax()`，别假设固定宽度；
- 中文最小 10.5px，英文最小 9px；
- 动效 120–200ms，`prefers-reduced-motion` 时关掉；
- 需要圆角时用 8–12px，胶囊用 999px。

## 8. ui/main.js：宿主 API

`main.js` 在面板页面里执行一次，宿主注入两个参数：

```js
// sill —— 宿主 API
// root —— 这张卡的 ShadowRoot
```

完整 API：

| 成员 | 说明 |
|---|---|
| `sill.id` | 组件 id |
| `sill.root` | 这张卡的 ShadowRoot（等于参数 `root`，方便闭包里用） |
| `sill.data()` | 当前数据的普通对象（同步） |
| `sill.onData(cb)` | 每次数据/语言/主题更新时调用 `cb({ data, language, tokens })`；注册后会立刻收到一帧 |
| `sill.onDispose(cb)` | 卡片卸载或热重载前调用；定时器、`window` 监听写这里 |
| `sill.command(action, arg?)` | 触发动作，等价于点 `data-sill-action`；需要对应权限 |
| `sill.storage.get()` | 读组件私有 JSON（`<userData>/widget-data/<id>.json`） |
| `sill.storage.set(obj)` | 整份覆盖写入 |
| `sill.storage.patch(obj)` | 浅合并写入 |
| `sill.host` | 宿主 preload API（`window.sill` 的完整对象），例如 `sill.host.addTodo(text)`、`sill.host.mediaCommand('next')`。高级逃生口，普通组件用不到 |

`onData` 的 `tokens` 是当前主题 CSS 变量的值（`--ink`、`--accent`…），给 `canvas` / WebGL 用：

```js
sill.onData(({ tokens }) => {
  ctx.strokeStyle = tokens['--accent'] || '#8f8'
})
```

注意：

- `main.js` 里**不要用 `document` 去碰卡片外面**，只用 `root`；需要宿主能力时用 `sill.host`；
- 只注册一次监听，不要在 `onData` 里重复 `addEventListener`；
- 卡片重载 = 旧实例销毁、新实例执行，全局状态请放 `sill.storage`；
- `<script>` 写在 `index.html` 里不会执行，JS 一律放 `main.js`。

### 组件设置（宿主渲染表单）

在 `widget.json` 里声明 `settings`，宿主会在「设置 → 组件」里为它渲染表单，值存到
`<userData>/widget-settings/<id>.json`，组件不用自己写设置 UI：

```json
"settings": [
  { "key": "city", "type": "text", "label": { "en": "City", "zh": "城市" }, "default": "Shenzhen" },
  { "key": "unit", "type": "select", "label": "Unit",
    "options": [{ "value": "c", "label": "°C" }, { "value": "f", "label": "°F" }], "default": "c" },
  { "key": "seconds", "type": "switch", "label": "Show seconds", "default": true },
  { "key": "refresh", "type": "number", "label": "Refresh", "min": 1, "max": 60, "default": 5 }
]
```

| 字段 | 说明 |
|---|---|
| `key` | 必填，标识符（`[A-Za-z_][A-Za-z0-9_]{0,31}`） |
| `type` | 必填：`text` / `number` / `switch` / `select` |
| `label` / `description` | 纯文本或 `{ "en": "...", "zh": "..." }` |
| `default` | 默认值；不填按类型给空值 |
| `placeholder` | text / number 的占位文案 |
| `min` / `max` | number 的范围 |
| `options` | select 必填：`[{ "value": "c", "label": "°C" }]` |

最多 16 项；写错的项会被忽略，不会阻塞安装。宿主会按类型校验（数字夹范围、select 只接受
声明过的值），组件读到的永远是合法值。

```js
const settings = await sill.settings.get()
sill.settings.onChange((values) => {
  // 用户在设置里改了；模板里有 onChange，web guest 只有 get / set
})
await sill.settings.set({ city: 'Tokyo' })
```

模板的 `main.js` 也可以在启动时读一次：

```js
sill.settings.get().then((values) => {
  if (values.seconds === false) root.querySelector('.seconds')?.remove()
})
```

最小示例（带清理）：

```js
const timeEl = root.getElementById('time')
sill.onData(({ data }) => {
  if (timeEl) timeEl.textContent = data.now?.time ?? '--:--'
})

const timer = setInterval(() => { /* ... */ }, 1000)
sill.onDispose(() => clearInterval(timer))
```

## 9. 资源与网络

- `ui/assets/**` 里的文件直接用相对路径：`<img src="assets/cover.svg">`、`url(bg.png)`、
  `@font-face { src: url(fonts/x.woff2) }`。宿主会改写成 `sill-asset://<id>/ui/...`。
- 也可以用绝对 URL：`https:` 的图片、字体、音视频、`fetch()` 都允许。
- 不允许远程脚本（`<script src="https://...">`），要拆 JS 请放 `ui/lib/*.js` 用
  `import('./lib/x.js')`（相对路径）。
- 组件可以 `fetch`，记得处理失败：网络不通时不要让卡片停在空白。

## 10. 调试

| 手段 | 做法 |
|---|---|
| DevTools | 点一下面板，按 **F12**（或 Ctrl+Shift+I） |
| 错误提示 | `main.js` 同步异常会在这张卡里显示红色提示条（含消息） |
| 热重载 | 保存 `skins/<组件>/` 下任何文件，只重载这个组件 |
| 组件存储 | 设置 → 组件 → 打开数据文件夹，看 `widget-data/<id>.json` |
| 校验 | `sill validate ./时钟目录` 或安装时的报错信息 |

## 11. 常见坑（静默失败清单）

1. `data-sill-text="cpu.usage > 50"` —— 指令不支持表达式，只会显示 `—`。请用 `main.js`。
2. `data` 里没声明的 id，绑定永远 `—`；`source` 拼错（如 `system.cpuu`）也是 `—`。
3. `data-sill-repeat` 绑到非数组 → 整段消失；数组项不是对象时只能用 `item` 本身。
4. `widget.json` 的 `ui` 必须是 `ui/index.html`，不能改。
5. 包内多放一个 `package.json` / `tools/` 会被安装器拒绝（文件只允许根目录元数据 + `ui/**`）。
6. `main.js` 里 `root.querySelector` 返回 `null` 时直接 `.textContent` 会抛错，先判空。
7. 定时器不写 `sill.onDispose` → 热重载后越积越多。
8. 组件里再写一层 `background` / `backdrop-filter` → 叠在玻璃上会发灰。

## 12. 配方（直接抄）

**A. 纯 HTML 时钟（无 JS）**

```html
<div class="clock">
  <span class="eyebrow" data-sill-i18n="title">LOCAL TIME</span>
  <strong class="hero" data-sill-text="now.time">--:--</strong>
  <span class="muted" data-sill-text="now.dateLabel"></span>
</div>
```

**B. 三条 meter（SVG 圆环）**

```html
<svg viewBox="0 0 80 80" class="ring">
  <circle class="ring__track" cx="40" cy="40" r="34" pathLength="100" />
  <circle class="ring__value" cx="40" cy="40" r="34" pathLength="100" data-sill-meter="cpu.usage" />
</svg>
```

```css
.ring__track { fill: none; stroke: rgba(255,255,255,.1); stroke-width: 7; }
.ring__value { fill: none; stroke: var(--accent); stroke-width: 7; stroke-linecap: round;
  stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--sill-value, 0));
  transition: stroke-dashoffset 420ms var(--ease-out); transform: rotate(-90deg);
  transform-origin: 50% 50%; }
```

**C. 媒体控制（动作）**

```html
<div class="media">
  <span class="muted" data-sill-if="!media.active" data-sill-i18n="empty">Nothing playing</span>
  <strong data-sill-if="media.active" data-sill-text="media.title"></strong>
  <div class="row">
    <button class="pill" data-sill-action="media.prev">‹</button>
    <button class="pill" data-sill-action="media.playpause">▶</button>
    <button class="pill" data-sill-action="media.next">›</button>
  </div>
</div>
```

**D. 列表（待办）**

```html
<ul class="tasks">
  <li data-sill-repeat="todos">
    <button class="pill" data-sill-action="todo.toggle" data-sill-action-arg="item.id">✓</button>
    <span data-sill-text="item.text"></span>
  </li>
</ul>
```

**E. 有状态的 JS（私有存储）**

```js
const btn = root.getElementById('btn')
let count = 0

sill.storage.get().then((saved) => {
  count = Number(saved.count) || 0
  btn.textContent = String(count)
})

btn.addEventListener('click', () => {
  count += 1
  btn.textContent = String(count)
  sill.storage.patch({ count })
})
```

**F. 远程封面**

```html
<img class="cover" id="cover" alt="" />
```

```js
sill.onData(({ data }) => {
  const cover = root.getElementById('cover')
  if (cover && data.media?.coverUrl) cover.src = data.media.coverUrl
})
```

## 13. 打包与分发

```powershell
sill validate .\clock     # 自检
sill pack .\clock         # 生成 clock-1.0.0.sill
```

双击 `.sill` 安装（会显示 id / 版本 / 作者 / 类型 / 权限）。也可以直接分发文件夹，
让对方放进 `skins/`。

安装提示按**实际能力**分档，而不是按作者自报的字段：

| 包内容 | 提示 |
|---|---|
| 纯静态：没有 `ui/main.js`，HTML 里也没有 `on*` / `<script>` | 不弹窗，直接安装 |
| 有代码：`main.js`、`on*` 或 `<script>` | 警告「在面板页面里执行代码，权限与 Sill 相同」 |
| `type: "web"`，无 Node | 说明「独立 webview，只走组件桥」 |
| `type: "web"` + `trust: "trusted"` | 警告完整 Node，需要勾选确认 |

确认过的 id 会记在 `<userData>/trust.json`；同一个组件能力不变时再装不会再问，能力升级
（比如后来加了 `main.js`）才会重新提示。

## 14. 给 AI 的构建清单

写一个组件时，按顺序完成并在最后逐条核对：

1. **建目录**：`widget.json`、`ui/index.html`、`ui/style.css`；有逻辑就加 `ui/main.js`。
2. **widget.json**：`schema:1`、`id`（小写，2–64 字符）、`name`、`version`、`type:"template"`、
   `ui:"ui/index.html"`；按需加 `size`、`span`、`data`、`strings`。
3. **数据**：每条绑定声明的 `source` 必须来自第 6 节列表；`id` 用短名。
4. **结构**：只画内容，不要背景/玻璃；`index.html` 里不写 `<script>`。
5. **样式**：颜色只用 `var(--ink*)` / `var(--accent*)` / `var(--serif|--sans)`；字号用 10/11/12.5/13.5/46；
   数字加 `tabular-nums`；在 185px 宽下不横向溢出。
6. **JS**（如果写）：`sill.onData` 更新 DOM，`sill.onDispose` 清理；查询结果判空；
   不要把状态放在函数外又依赖它跨重载存活（用 `sill.storage`）。
7. **自检**：文件夹放进 `skins/` → 勾选显示 → F12 console 无报错 → 改文件能热重载 →
   缩到最窄/最宽都不破版。
8. **交付**：给出文件树 + 每个文件完整内容，不要省略；不要引入构建步骤或依赖。

## 15. 兼容与版本

- `widget.json` 的 `schema` 目前是 `1`；
- `runtime` / `engine` 是可选元数据，不填不会阻止安装；
- 新增指令/字段只增不改；删除或改语义会升主版本。

---

相关文档：[manifest](manifest.md) · [工具与目录](package.md) · [运行时契约](runtime.md) ·
[数据源字段](providers.md) · [信任模型](security.md) · [路线图](roadmap.md)
