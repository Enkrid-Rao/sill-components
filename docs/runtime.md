# Runtime contract

组件跑在宿主 renderer 里，不直接碰 Electron IPC。它看到的是一份由宿主裁剪过的环境：
语言、时间、尺寸、主题、数据、设置、存储和命令。

**v1 的范围：声明式组件只读。** 需要输入、逐行动作、动画时间线的组件用脚本；
v1.1 再评估本地状态模型。这个边界写在 [ir.md](ir.md) 里，runtime 只负责把环境交出去。

## 1. 生命周期

```
validate → load → mount → show → update → hide → dispose
                    ↑        ↓
                settings / data / theme / size
```

| 阶段 | 做什么 | 失败时 |
|---|---|---|
| `validate` | 校验 manifest、权限、路径、大小、版本 | 不加载，安装器不写文件 |
| `load` | 解析 IR 或创建 sandbox iframe | 卡片显示错误占位 |
| `mount` | 只执行一次；建立状态、绑定事件 | 只影响当前卡片 |
| `show` | 面板唤出；可触发一次刷新 | 不影响其他卡 |
| `update` | 数据、主题、语言、尺寸变化 | 保留上一帧，记录错误 |
| `hide` | 面板收起；停动画、停计时器 | 不阻塞收起 |
| `dispose` | 卸载；清监听器、计时器、请求 | 记录泄漏警告 |

组件必须能在 `hide` 后再次 `show`。不要把「只初始化一次」的东西放在 `show`。
`mount` 可以是异步的，但必须自己捕获异常；未捕获的 rejection 会被宿主当成崩溃。

## 2. 共享环境

声明式与脚本看到同一组环境值，只是拿法不同：

| 字段 | 类型 | 声明式 | 脚本 |
|---|---|---|---|
| `language` | `'zh' \| 'en'` | `i18n` / `format()` 自动使用 | `ctx.language` |
| `now` | `Date`（脚本）/ `time.now`（声明式） | `time.now` provider | `ctx.now` |
| `size` | `{ width, columns }` | 布局由引擎处理 | `ctx.size` |
| `theme` | `ThemeTokens` | 通过 style token | `ctx.theme` |
| `data` | provider 快照 | `bind` | `ctx.data.<id>()` |
| `settings` | 组件设置 | `settings.<key>` | `ctx.settings.get()` |
| `storage` | 组件键值（需权限） | 不开放 | `ctx.storage` |
| `commands` | 宿主命令（需权限） | `button.action` | `ctx.command()` |

`size.width` 是**卡片内容宽度**，不是面板宽度。它会在 185–1110 之间变化；
`size.columns` 是当前面板列数，1–3。

## 3. 脚本的 Context

完整接口在 [scripts.md](scripts.md)。这里只列容易混淆的几条：

- `ctx.data` 的键是 manifest `data[].id`，不是 provider 名。
- `ctx.onUpdate(callback)` 的回调带 `{ changed: string[], reason: 'data' | 'theme' | 'language' | 'size' | 'settings' }`。
- `ctx.settings.get()` 返回当前组件的设置对象；`set()` 是异步的，写盘成功后触发一次 `onUpdate`。
- `ctx.command(name, args)` 只包含 manifest 声明过的命令；没声明就调用会 reject。
- `ctx.reducedMotion` 是布尔值；不要在 iframe 里自己去 `matchMedia`。

## 4. Sill 0.5.1 实际提供什么

这一节是迁移用的，不是公开 API。0.5.1 的内置组件拿到的是：

```ts
interface WidgetContext {
  language: 'zh' | 'en'
  now: Date
  snapshot: PanelSnapshot | null
  todos: TodoItem[]
  mediaPosition: number
  mediaProgress: number
  mediaCommand(action, value?): Promise<MediaControlState | null>
  onAddTodo(text): Promise<void>
  onToggleTodo(id): Promise<void>
  onUpdateTodo(id, text): Promise<void>
  onRestoreTodo(item, index): Promise<void>
  onRemoveTodo(id): Promise<void>
}
```

对照本文件的目标：

| 0.5.1 | v1 目标 | 变化 |
|---|---|---|
| `snapshot` | `data` provider | 拆分、改名；字段见 [providers.md](providers.md) |
| `todos` | provider `todo.list` | 改名；绑定名由 manifest 决定 |
| `mediaPosition` / `mediaProgress` | `media.nowPlaying.position` / `progress` | 移进 provider |
| `mediaCommand` | `ctx.command('media.*')` | 改名 |
| `onAddTodo` 等 | `ctx.command('todo.*')` | 从回调改成命令 |
| 无 | `theme` / `size` / `settings` / `storage` / `commands` | 新增 |

**这不是「公开化」，是重设计。** 写脚本组件时按 v1 目标写，不要照抄 0.5.1 的 context；
内置组件的源码只能当行为参考，不能当 API 参考。

## 5. 尺寸与列

面板宽度连续可调，列数由宽度推导。按 0.5.1 的 CSS（面板内边距 18×2、卡片内边距 13/14 或 15/16、
边框 1、间距 9 或 11）估算：

| 面板宽 | 列数 | 单跨卡片内容宽 | 说明 |
|---|---|---|---|
| 320 | 1 | 254 | 最窄面板 |
| 384 | 1 | 318 | 默认 rail |
| 485 | 2 | 190 | 刚进两列 |
| 660 | 2 | 273 | board |
| 714 | 3 | 185 | 刚进三列，最窄卡片 |
| 920 | 3 | 253 | wide |
| 1180 | 3 | 340 | 单跨 |
| 1180 | 3 | 1110 | 跨 3 列 |

不是所有组件都会遇到 185px。`span.default` 可以要求更多列；但**单跨卡必须能在 185px 下不横向溢出**，
这是发布门槛，不是建议。

- `span.default`：用户没有手动设置时的默认跨列。
- `span.byColumns`：按列数给不同默认值，例如 `{ "1": 1, "2": 2, "3": 3 }`。
- 用户的 `layout.spans` 永远优先；宿主把 span 夹到当前列数。
- `size.w/h` 是目录展示与初始占位的建议值，宿主不会据此改窗口。
- `minW` 是作者自测与目录展示用的建议值；v1 **不会**因为 `minW` 自动重排其他卡片。
  如果内容在 185px 下不可读，正确做法是设 `span.default: 2` 或 3，而不是依赖 `minW`。

## 6. 主题 token

```ts
interface ThemeTokens {
  ink: string          // 主文字
  inkSoft: string      // 次级文字
  inkDim: string       // 说明文字
  inkFaint: string     // 最弱提示
  accent: string
  accentPale: string
  accentWash: string
  accentInk: string
  accentSoft: string
  accentGlow: string
  radius: { card: number; control: number; pill: number }
  font: { sans: string; serif: string }
  glass: { fill: string; border: string; highlight: string }
}
```

- 这些 token 是组件能用的全部颜色与圆角；不要硬编码 hex / rgba。
- `radius.card` 是卡片内圆角，不是面板的 34px；面板圆角不开放给组件。
- `glass` 是卡片内部小玻璃块的填充 / 描边 / 高光，不是面板玻璃。
- **token 里没有 `backdrop-filter`。** 组件不能自己采样桌面或做实时模糊；
  这是性能约束，也是视觉一致性约束。
- 主题切换会触发 `update`；脚本里用 `ctx.theme` 重绘，不要把旧颜色缓存到 canvas 后不刷新。

## 7. 事件

| 事件 | 触发 | 组件做什么 |
|---|---|---|
| `update` | 数据、主题、语言、尺寸变化 | 只更新变化部分；声明式由引擎重建 |
| `show` | 面板滑入 | 启动动画 / 拉一次数据 |
| `hide` | 面板收起 | 停计时器、动画、请求 |
| `click` | 卡片内点击 | 只处理自己的交互 |
| `hover` | 指针进入卡片 | 可选；不要依赖 hover 传达状态 |

全局快捷键、窗口唤出、Esc、拖拽缩放属于宿主。组件不能注册全局快捷键，也不能拦截 Esc。

## 8. 错误与降级

- 组件抛错：只替换当前卡片为错误占位，其他卡不受影响。
- 数据缺失：显示 `—` 或 `Loading`，不要抛错。
- 网络失败：保留上一次成功值；provider 用 `stale` / `error` 表达状态。
- 脚本超时 / 崩溃：销毁 iframe，显示「组件已停止」，可手动重载。
- 组件不能阻止面板收起，也不能把宿主窗口抢到前台。

## 9. 性能预算

| 指标 | 预算 | 说明 |
|---|---|---|
| `mount` | < 50 ms | 不含首次 provider 采样 |
| 常规 `update` | < 8 ms | 单个 provider 变化引起的重绘 |
| 自建轮询 | ≤ 10 Hz | 超过直接拒绝 |
| 动画 | 只改 `transform` / `opacity` | 不做 layout thrash |
| 常驻内存 | 建议 < 8 MB | 硬上限 64 MB，超过停止并提示 |
| 列表 | >100 项用脚本 + 虚拟化 | IR 列表不虚拟化 |

## 10. 可访问性

- 图标按钮必须有可访问名称（IR 的 `ariaLabel` / `ariaI18n`，脚本的 `aria-label`）。
- 交互元素必须能用键盘到达；焦点环不能去掉。
- 颜色不是唯一状态表达：完成 / 错误要有文字或形状。
- 尊重 `prefers-reduced-motion`：动画可关闭，状态不能只靠动画表达。
- 中文最小字号 10.5px；正文 13.5–14px。英文可以更小，但不要低于 9px。

## 11. 版本

- runtime 契约随 `engine` 版本走；`engine` 主版本变化表示破坏性变更。
- 新字段只增不改；删除字段必须升主版本。
- 宿主版本（`runtime`）与引擎版本（`engine`）是两条线，不要混用。
