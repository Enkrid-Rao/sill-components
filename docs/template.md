# Template 组件

模板组件是 **HTML / CSS + 可选 JS**，由宿主挂到 Shadow DOM 里，放在 `WidgetShell` 的 `.card` 中。
它不拥有自己的窗口；`ui/main.js` 直接在宿主页面里执行，和 Rainmeter 的 Lua 一样是可信本地代码。

**为什么不是 iframe：** Sill 的玻璃在 `.card` 上，atmosphere 在 `.rail__atmo`。
iframe 会切断这条链，透明窗口里的 iframe 只能得到白底，再复制一层“仿玻璃”必然不一致。
模板直接作为卡片的子内容渲染，玻璃和 atmosphere 是原生的。

## 包结构

```text
my-widget/
├─ widget.json
└─ ui/
   ├─ index.html   # 内容结构
   ├─ style.css    # 内容样式
   ├─ main.js      # 可选：宿主页面内执行
   └─ assets/      # 可选：图片 / 字体
```

- `widget.json` 的 `ui` 在 v1 固定为 `ui/index.html`；
- `style.css` 固定放在 HTML 同目录；
- `main.js` 可选；没有它就是纯静态卡；
- `assets/**` 通过 `sill-asset://<id>/ui/...` 访问；`<img src="assets/x.png">` 和
  `url(bg.png)` 会被宿主自动改写，直接可用。

## 渲染

```text
WidgetShell
  └─ section.card          # 玻璃、圆角、边框、padding
       └─ shadow root      # 模板 HTML + CSS
            └─ 内容
```

- HTML、CSS 原样写入 Shadow DOM（不做标签审查）；
- CSS 只在 Shadow DOM 内生效；
- 宿主在 shadow host 上设置 `display:block; color:var(--ink); font-family:var(--sans)`；
- 模板不要给 `:host` / 根节点铺背景；背景由 `.card` 负责；
- atmosphere 在卡片背后，模板不需要复制渐变。

## HTML / CSS

模板里可以写任意 HTML 与 CSS：`<svg>`、`<img>`、内联 `style`、`on*` 属性、`@keyframes`、
`conic-gradient`、`mask` 都可以。宿主不清洗标签，也不维护白名单。

- `on*` 会执行，作用域是宿主页面；
- `<script>` 标签通过 `innerHTML` 插入，浏览器不会执行——要 JS 就写 `ui/main.js`；
- `src` / `href` / CSS `url()` 的相对路径会被改写为 `sill-asset://<id>/ui/...`；
- 样式写在 `ui/style.css`，只在当前 Shadow DOM 内生效。

## 内联 JS

`ui/main.js` 在宿主页面里执行，宿主注入两个参数：

```js
sill.onData(({ data, language, tokens }) => {
  const cpu = data.cpu?.usage ?? 0
  root.querySelector('.ring__value').style.setProperty('--value', cpu)
})
```

| API | 说明 |
|---|---|
| `sill.data()` | 当前数据对象（与 `data-sill-text` 同源） |
| `sill.onData(cb)` | 每次快照 / 语言变化时回调，`cb({ data, language, tokens })` |
| `sill.command(action, arg?)` | 触发白名单动作，如 `media.playpause`、`todo.toggle` |
| `sill.storage.get()` | 读组件私有 JSON |
| `sill.storage.set(value)` | 覆盖写入 |
| `sill.storage.patch(partial)` | 合并写入 |
| `sill.host` | 宿主 preload API（读设置、待办等） |
| `sill.id` | 组件 id |
| `root` | 这张卡的 shadow root |

- 脚本只执行一次；数据更新走 `onData`，不会重新执行；
- 组件存储落在 `<userData>/widget-data/<id>.json`，不进 `.sill` 包；
- 抛错会进宿主控制台，不影响其他卡片。

## 数据绑定

文本：

```html
<span data-sill-text="now.time"></span>
<span data-sill-text="now.dateLabel"></span>
```

本地化（文本来自 manifest 的 `strings`）：

```html
<div class="clock__label" data-sill-i18n="label"></div>
```

条件：

```html
<div data-sill-if="media.active">正在播放</div>
<div data-sill-if="!media.active">未在播放</div>
```

- `data-sill-if` 只接受路径，`!` 取反；没有 `==`、函数或表达式；
- 假值（`false` / `0` / `''` / `null` / `undefined`）隐藏节点（`hidden`），真值恢复显示；
- 数据变化只更新绑定的文本、CSS 变量和可见性，不重建 DOM——CSS 过渡可以跨采样继续。

列表：

```html
<div class="row" data-sill-repeat="processes.topRam">
  <span data-sill-text="item.name"></span>
  <span data-sill-text="item.mb"></span>
</div>
<div data-sill-if="!processes.topRam.length">暂无数据</div>
```

- `data-sill-repeat` 的值必须是数组；
- 空数组会移除模板行；
- 行内用 `item.*` 读当前项，`item` 本身也可以绑定；
- 嵌套 repeat 最多展开 8 层，超过不再展开。

规则：

- 路径的根来自 manifest `data[].id`；
- `data-sill-repeat` 内部额外有 `item` 作用域；
- 缺失值渲染 `—`；
- 字段必须在 [providers.md](providers.md) 中定义；
- 不允许任意 JS 表达式、函数调用或写操作。

还没做：格式化函数、`data-sill-style` 这类通用样式绑定。

## 动作

```html
<button type="button" data-sill-action="media.playpause">▶</button>
<button type="button" data-sill-action="todo.toggle" data-sill-action-arg="item.id">完成</button>
```

- 只有白名单动作，模板不能自定义命令；
- `media.playpause` / `media.next` / `media.prev` / `media.mute` 需要 `action.media`；
- `todo.toggle` 需要 `action.todo`；
- `data-sill-action-arg` 是路径，在 repeat 内可用 `item.*`；
- 动作在宿主里执行，模板没有 JS；
- 没有声明对应权限时点击无效。

## 样式绑定

进度条只需要数值，不需要通用样式表达式：

```html
<div class="bar"><div class="bar__fill" data-sill-meter="cpu.usage"></div></div>
```

```css
.bar__fill {
  width: calc(var(--sill-value, 0) * 1%);
}
```

- 宿主把 0–100 的数字写到 `--sill-value`；
- 不提供任意 CSS 字符串，避免注入和布局逃逸；
- 没有值或非数字时不设置变量，CSS 回退到 0。

## 样式 token

Shadow DOM 会继承宿主的 CSS 自定义属性，模板直接用：

| token | 用途 |
|---|---|
| `--ink` / `--ink-soft` / `--ink-dim` / `--ink-faint` | 文字层级 |
| `--accent` / `--accent-pale` / `--accent-soft` / `--accent-glow` | 强调色 |
| `--accent-2` | 第二强调色（暖色） |
| `--accent-h` | 强调色相，想自己用 `hsl()` 时用 |
| `--sans` / `--serif` | 字体栈 |
| `--radius` / `--radius-card` | 面板圆角 / 卡片内圆角 |

不要硬编码玻璃色、不要用 `--atmo-*` 复刻 atmosphere、不要用 `backdrop-filter`。

## 布局与溢出

- 根节点宽度 = 卡片内容宽度（约 185–1110px）；
- 高度由内容决定，滚动由面板负责；
- 不允许绝对定位撑出卡片；
- 中文最小字号 10.5px；正文 13.5–14px；
- 模板必须在 320–1180 面板宽、1/2/3 列下不横向溢出。

## 版本

- 模板格式随 `engine` 版本走；
- 新字段 / 新指令只增不改；破坏性变化升 `engine` 主版本；
- 宿主不再清洗标签，旧模板可以原样加载。
