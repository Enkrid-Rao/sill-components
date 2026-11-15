# IR（声明式布局）

IR 是 JSON 的组件树。宿主把它编译成受主题约束的 React 节点；组件作者不写 HTML/CSS。

**状态：引擎尚未实现。** 当前 Sill 的内置组件是手写 React；本文件是 `packages/engine`
的输入契约。

## 根节点

`ui/layout.json` 的根必须是一个布局节点：

```json
{
  "type": "vstack",
  "gap": 6,
  "children": [
    { "type": "text", "bind": "now.time", "style": "display" },
    { "type": "text", "bind": "now.date", "style": "caption" }
  ]
}
```

## 节点

| 节点 | 属性 | v1 |
|---|---|---|
| `vstack` | `gap`, `align`, `padding`, `children` | ✓ |
| `hstack` | `gap`, `align`, `justify`, `wrap`, `children` | ✓ |
| `overlay` | `children` | ✓ |
| `text` | `bind` / `value`, `style`, `format`, `maxLines`, `align` | ✓ |
| `image` | `src`, `fit`, `radius`, `alt` | ✓ |
| `bar` | `bind`, `min`, `max`, `height`, `color` | ✓ |
| `ring` | `bind`, `size`, `thickness` | ✓ |
| `divider` | `inset` | ✓ |
| `spacer` | `size` | ✓ |
| `list` | `items`, `itemTemplate`, `empty` | ✓ |
| `button` | `label`, `action`, `variant` | ✓ |
| `input` | `bind`, `placeholder`, `onSubmit` | ✓ |
| `grid` | `cols`, `rows`, `gap` | ✗ 推迟 |
| `line` / `histogram` | — | ✗ 随 rmskin 再评估 |
| `canvas` / 绝对定位 | — | ✗ 留给脚本组件 |

未知节点必须**校验失败**，不能静默忽略。

## 绑定表达式

```text
now.time
system.cpu.usage
format(now.time, "HH:mm")
round(system.memory.percent)
if(system.cpu.usage > 80, "hot", "calm")
```

支持：

- 字段访问：`a.b.c`
- 字面量：数字、字符串、布尔、`null`
- 函数：`format` `round` `floor` `ceil` `if`
- 比较：`> >= < <= == !=`
- 算术：`+ - * / %`
- 括号

不支持：任意 JS、函数定义、赋值、循环、属性写入、原型访问、动态 `eval`。

绑定在**只读数据**上求值；求值失败渲染 `—` 并把错误报告给开发者面板，不抛出到宿主。

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

- token 由宿主根据 `language` / `data-cols` / 主题解析；组件不能覆盖字号、颜色、圆角、阴影。
- 允许的局部覆盖只有：`align`、`maxLines`、`gap`、`padding`、`wrap`。
- 中文 token 的最小字号由宿主保证（≥10.5px），组件不能把 caption 压到 8px。

## 列表

```json
{
  "type": "list",
  "items": "todos",
  "empty": { "type": "text", "value": "Nothing here", "style": "caption" },
  "itemTemplate": {
    "type": "hstack",
    "gap": 8,
    "children": [
      { "type": "text", "bind": "item.text", "style": "body", "maxLines": 1 },
      { "type": "text", "bind": "item.done", "style": "caption" }
    ]
  }
}
```

- `items` 是数组绑定；`item.*` 是当前项作用域。
- 列表不保存状态；过滤/排序由 provider 或组件脚本负责。
- 列表默认不虚拟化；超过 100 项需要脚本组件或 `virtual`（v2）。

## 按钮与输入

```json
{
  "type": "input",
  "bind": "draft",
  "placeholder": "Add a task",
  "onSubmit": { "type": "action", "name": "todo.add", "args": { "text": "$value" } }
}
```

- `action` 只能调用 manifest `permissions` 允许的宿主命令。
- 输入框的 `bind` 指向组件自己的临时状态，不写回数据源，除非 `onSubmit` 明确提交。
- 按钮的 `variant` 只有 `primary` / `ghost` / `danger`，由宿主 token 决定。

## 布局规则

- 根节点宽度 = 卡片内容宽度；高度 = 内容高度（可滚动由宿主处理）。
- `hstack` 默认 `align: center`；`vstack` 默认 `align: stretch`。
- `wrap: true` 时子元素可换行；否则超出以省略号/裁切处理。
- `padding` 只接受 0–24 的整数，单位逻辑 px。
- `gap` 只接受 0–24 的整数。
- 不接受绝对定位、`calc`、百分比宽度；响应式由宿主列宽驱动。

## 版本

- IR 节点只增不改；破坏性变更升 `schema`。
- 新节点在旧宿主上必须校验失败并给出明确错误，不能降级成空白。
- v1 不包含绝对定位、动画时间线、自定义 CSS；这些需要脚本组件。
