# Template 组件

v1 的第三方组件是一个 **HTML/CSS 模板**，由宿主清洗后挂到 Shadow DOM 里，
放在 `WidgetShell` 的 `.card` 中。它不执行 JS，也不拥有自己的窗口。

**为什么不是 iframe：** Sill 的玻璃在 `.card` 上，atmosphere 在 `.rail__atmo`。
iframe 会切断这条链，透明窗口里的 iframe 只能得到白底，再复制一层“仿玻璃”必然不一致。
模板直接作为卡片的子内容渲染，玻璃和 atmosphere 是原生的。

## 包结构

```text
my-widget/
├─ widget.json
└─ ui/
   ├─ index.html   # 内容结构；不写 <script>
   └─ style.css    # 内容样式
```

- `widget.json` 的 `ui` 在 v1 固定为 `ui/index.html`；
- `style.css` 固定放在 HTML 同目录；
- 不打包 JS；`ui/*.js` 会被校验拒绝；
- 没有 `assets/`、`locales/`、`settings/`；这些是后续版本。

## 渲染

```text
WidgetShell
  └─ section.card          # 玻璃、圆角、边框、padding
       └─ shadow root      # 模板 HTML + CSS
            └─ 内容
```

- HTML 在清洗后写入 Shadow DOM；
- CSS 只在 Shadow DOM 内生效；
- 宿主在 shadow host 上设置 `display:block; color:var(--ink); font-family:var(--sans)`；
- 模板不要给 `:host` / 根节点铺背景；背景由 `.card` 负责；
- atmosphere 在卡片背后，模板不需要复制渐变。

## HTML 白名单

允许的标签：

```text
div span p section ul ol li strong em small b i br h1 h2 h3 h4 button
```

允许的属性：

```text
class id role type aria-* data-sill-*
```

不允许：

- `<script>` / `<style>` / `<link>` / `<iframe>` / `<img>` / `<svg>`；
- `on*` 事件属性；
- `style` 属性、`href`、`src`；
- 自定义标签、表单控件、媒体元素。

未知标签会被整段移除；未知属性会被删掉。正式版还要补 URL / 资源白名单和更严格的
sanitizer 测试。

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
- 假值（`false` / `0` / `''` / `null` / `undefined`）会移除节点，真值保留；
- 每次数据变化会重建 shadow root，再重新求值。

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

还没做：格式化函数、图片 / 资源绑定。

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
| `--accent` / `--accent-pale` / `--accent-soft` | 强调色 |
| `--sans` / `--serif` | 字体栈 |
| `--radius` | 面板圆角；卡片内部圆角按 18px |

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
- 旧宿主遇到未知标签 / 属性会清洗掉，不会执行。
