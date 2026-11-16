# IR（声明式布局）

IR 是 JSON 的组件树。宿主把它编译成受主题约束的 React 节点；作者不写 HTML/CSS。

**v1 的范围：只读展示 + 命令按钮。** 没有本地状态、没有输入框、没有逐行动作。
需要这些的组件用脚本，等 v1.1 的状态模型定下来再回到 IR。这个边界是有意的：
先把「怎么画」做对，再谈「怎么改」。

## 根节点

`ui/layout.json` 的根必须是一个布局节点：

```json
{
  "type": "vstack",
  "gap": 6,
  "children": [
    { "type": "text", "bind": "now.time", "style": "display" },
    { "type": "text", "bind": "now.dateLabel", "style": "caption" }
  ]
}
```

## 节点

| 节点 | 属性 | v1 |
|---|---|---|
| `vstack` | `gap`, `padding`, `align`, `children` | ✓ |
| `hstack` | `gap`, `padding`, `align`, `justify`, `wrap`, `children` | ✓ |
| `overlay` | `align`, `children` | ✓ |
| `text` | `bind` / `value` / `i18n`, `style`, `maxLines`, `align` | ✓ |
| `image` | `src` 或 `bind` + `map`, `fallback`, `fit`, `alt` / `altI18n` | ✓ |
| `bar` | `bind`, `min`, `max`, `height`, `tone` | ✓ |
| `ring` | `bind`, `min`, `max`, `size`, `thickness`, `tone` | ✓ |
| `divider` | `inset` | ✓ |
| `spacer` | `size` 或 `grow` | ✓ |
| `list` | `items`, `limit`, `itemTemplate`, `empty` | ✓ |
| `button` | `label` / `i18n` / `icon`, `ariaLabel` / `ariaI18n`, `variant`, `disabled`, `action` | ✓ |
| `input` | — | v1.1 草案 |
| `checkbox` | — | v1.1 草案 |
| `grid` | — | 推迟 |
| `line` / `histogram` | — | 随 rmskin 再评估 |
| `canvas` / 绝对定位 | — | 脚本组件 |

未知节点必须**校验失败**，不能静默忽略。

### text

`bind` / `value` / `i18n` 三者只能有一个。

```json
{ "type": "text", "bind": "cpu.usage", "style": "mono", "maxLines": 1 }
{ "type": "text", "i18n": { "key": "system.title" }, "style": "caption" }
{ "type": "text", "value": "—", "style": "caption" }
```

- `style` 只能取 token，见下。
- `maxLines` 1–4；超出以省略号截断。
- `align` 只影响文本自身，不影响父容器。

### image

```json
{ "type": "image", "src": "assets/cover.jpg", "fit": "cover", "alt": "Album cover" }
```

```json
{
  "type": "image",
  "bind": "weather.code",
  "map": {
    "0": "assets/sun.svg",
    "1": "assets/sun-cloud.svg",
    "3": "assets/cloud.svg",
    "61": "assets/rain.svg"
  },
  "fallback": "assets/cloud.svg",
  "altI18n": { "key": "weather.icon" }
}
```

- `src` 或 `bind + map` 二选一。
- 本地路径必须以 `assets/` 开头，且出现在 manifest `assets` 中。
- 远程 `https://` 图片必须声明 `network` 权限与该域名；v1 不建议这么做。
- `fit`：`cover`（默认）/ `contain`。
- `image` 没有 `radius`；圆角由宿主按卡片 token 处理。

### bar / ring

```json
{ "type": "bar", "bind": "cpu.usage", "height": 5, "tone": "accent" }
{ "type": "ring", "bind": "memory.percent", "size": 64, "thickness": 6, "tone": "warm" }
```

- `min` 默认 0，`max` 默认 100；`min < max`。
- `bar.height` 2–16；`ring.size` 32–120；`ring.thickness` 3–16。
- `tone` 只有 `accent` / `warm` / `neutral`，由宿主 token 决定颜色。
- **没有 `color` 属性。** 组件不能传 hex 或 rgba；这是主题一致性的硬约束。

### list

```json
{
  "type": "list",
  "items": "processes.topRam",
  "limit": 2,
  "empty": { "type": "text", "i18n": { "key": "process.empty" }, "style": "caption" },
  "itemTemplate": {
    "type": "hstack",
    "justify": "between",
    "children": [
      { "type": "text", "bind": "item.name", "style": "body", "maxLines": 1 },
      { "type": "text", "bind": "item.mb", "style": "mono" }
    ]
  }
}
```

- `items` 必须是数组 provider 的绑定，例如 `processes.topRam`、`todo.list`。
- `item` 是当前项作用域；`itemTemplate` 里只能访问 `item.*` 和 `settings.*`，不能再访问其他数据根。
- `limit` 1–100；不写表示全量。超过 100 项用脚本 + 虚拟化。
- `empty` 在数组为空时渲染；不写则空白。
- **v1 的列表行里不能放 `button`。** 没有 `$item` 参数绑定，放了也不知道操作哪一项。
  这是 v1.1 要补的第一块。

### button

```json
{
  "type": "button",
  "label": "Refresh",
  "variant": "ghost",
  "action": { "type": "action", "name": "data.refresh", "args": {} }
}
```

```json
{
  "type": "button",
  "icon": "assets/play.svg",
  "ariaI18n": { "key": "media.play" },
  "variant": "primary",
  "action": { "type": "action", "name": "media.playpause" }
}
```

- `label` / `i18n` / `icon` 至少一个；有 `icon` 且没有可见文字时，必须有 `ariaLabel` 或 `ariaI18n`。
- `variant`：`primary` / `ghost` / `danger`。
- `disabled` 可以绑定一个布尔表达式。
- `action.args` 只接受 JSON 字面量（字符串、数字、布尔、null）；没有动态参数。
- 命令名必须在 [commands.json](../spec/commands.json) 中，且权限已声明。
- 命令失败时宿主不改变本地状态；组件应依赖 provider 刷新后的值。

## 绑定表达式

```text
now.time
cpu.usage
format(now.iso, "HH:mm")
round(cpu.usage)
if(cpu.usage > 80, "hot", "calm")
settings.hour12
```

支持：

- 字段访问：`a.b.c`
- 字面量：数字、字符串、布尔、`null`
- 函数：`format` `round` `floor` `ceil` `if`
- 比较：`> >= < <= == !=`
- 逻辑：`and` `or` `not`
- 算术：`+ - * / %`
- 括号

不支持：任意 JS、函数定义、赋值、循环、属性写入、数组索引、原型访问、动态 `eval`。

### 求值规则

- `+`：两个数字相加；任一是字符串时做拼接。
- `- * / %`：只接受数字；除零返回错误。
- 比较：数字按数值，字符串按字典序；类型不同返回错误。
- `and` / `or`：短路求值；返回布尔值。
- `if(cond, a, b)`：只求值被选中的分支；`cond` 按真值判断。
- 真值：`false`、`null`、`0`、`""` 为假，其余为真；数组 / 对象不作为布尔值使用。
- `round`：四舍五入到整数（与 JS `Math.round` 一致）；`floor` / `ceil` 同理。
- `format(value, pattern)`：`value` 必须是 ISO 8601 字符串，例如 `now.iso`；
  pattern 支持 `YYYY` `MM` `DD` `HH` `mm` `ss` `MMM`（短月名）`D` `M` `ddd`（短星期）。
  结果按 `language` 本地化，时区使用宿主本地时区。
- 求值失败：渲染 `—`，把表达式与错误写进开发者面板，不抛到宿主。

`format` 不要套在已经格式化好的 `now.time` 上；要自定义格式就用 `now.iso`。

## 样式 token

IR 不使用原始 CSS，只引用 token：

| token | 用途 |
|---|---|
| `display` | 大号数字 / 时钟（Instrument Serif） |
| `title` | 卡片标题 |
| `body` | 正文 |
| `caption` | 日期 / 分组标题 / 注释 |
| `mono` | 等宽数值 |
| `bar` | 进度条 |
| `glass` | 卡片内的小玻璃块 |

- token 由宿主根据 `language` / 主题解析；组件不能覆盖字号、颜色、圆角、阴影。
- 允许的局部覆盖只有：`align`、`maxLines`、`gap`、`padding`、`wrap`。
- 中文 token 的最小字号由宿主保证（≥10.5px），组件不能把 caption 压到 8px。

## 布局规则

- 根节点宽度 = 卡片内容宽度（约 185–1110px）；高度 = 内容高度，可滚动由宿主处理。
- `hstack` 默认 `align: center`；`vstack` 默认 `align: stretch`。
- `wrap: true` 时子元素可换行；否则超出以省略号 / 裁切处理。
- `padding` / `gap` 只接受 0–24 的整数，单位逻辑 px。
- 不接受绝对定位、`calc`、百分比宽度；响应式由宿主列宽驱动。
- `overlay` 只用于叠放，不提供 z-index、偏移或拖拽。

## i18n

- IR 里的用户可见文字必须来自 `i18n`，或语言中性的符号（`—`、`%`、数字）。
- 不要写 `"value": "Nothing here"`；用 `i18n` + `locales`。
- `params` 支持字符串 / 数字 / 布尔，替换文案里的 `{name}`。
- 缺失 key 回退到 `en`，仍缺失则显示 key 并在开发者面板警告。

## v1.1 草案：输入与本地状态

这一节不是 v1 的一部分，schema 不接受；写在这里是为了让引擎实现者知道方向，
也避免再出现「文档说能写表单、IR 却做不到」的情况。

```json
{
  "state": {
    "draft": { "type": "string", "initial": "" }
  },
  "children": [
    {
      "type": "input",
      "bind": "state.draft",
      "placeholderI18n": { "key": "todo.addPlaceholder" },
      "onSubmit": {
        "type": "action",
        "name": "todo.add",
        "args": { "text": { "bind": "state.draft" } }
      }
    }
  ]
}
```

要解决的四件事：

1. `state` 声明与初始值；
2. action 参数里的动态绑定（`state.*`、`item.*`、`$value`）；
3. 动作成功后的状态清理 / 乐观更新规则；
4. 行内动作的作用域（`item.id`）。

在这些定下来之前，todo / media 这类组件走脚本。

## 版本

- IR 节点只增不改；破坏性变更升 `schema` 与 `engine` 主版本。
- 新节点在旧宿主上必须校验失败并给出明确错误，不能降级成空白。
- v1 不包含绝对定位、动画时间线、自定义 CSS；这些需要脚本组件。
