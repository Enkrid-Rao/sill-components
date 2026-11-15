# Runtime contract

组件运行在宿主的 renderer 里；它看到的不是 Electron API，而是一份 `WidgetContext`。

**当前状态：** Sill 0.5 的内置组件通过 TypeScript 的 `WidgetContext` 接收数据
（`apps/desktop/src/renderer/src/widgets/types.ts`）。下面这份契约是它的公开化版本，
IR 引擎与脚本沙箱落地后保持不变。

## 1. 生命周期

```
validate → load → mount(ctx) → show(ctx) → update(ctx) → hide(ctx) → dispose()
                                      ↕
                                  settings / data changes
```

| 阶段 | 说明 |
|---|---|
| `validate` | 校验 manifest、权限、路径、大小；失败不加载 |
| `load` | 解析 IR 或创建 sandbox iframe；不执行网络 |
| `mount` | 只执行一次；建立本地状态、绑定事件 |
| `show` | 面板唤出时调用；可以触发一次刷新 |
| `update` | 数据/主题/语言/尺寸变化时调用；最小化重绘 |
| `hide` | 面板收起时调用；停止动画、释放临时资源 |
| `dispose` | 卸载时调用；清理定时器、监听器、网络请求 |

组件必须能在 `hide` 后再次 `show`，不能把“只初始化一次”的逻辑放在 `show`。

## 2. Context

```ts
interface WidgetContext {
  // 环境
  language: 'zh' | 'en'
  now: Date
  size: { width: number; columns: 1 | 2 | 3 }
  theme: ThemeTokens

  // 数据（只读快照）
  snapshot: PanelSnapshot | null
  todos: TodoItem[]

  // 媒体派生值
  mediaPosition: number
  mediaProgress: number

  // 命令
  mediaCommand(action: MediaAction, value?: number): Promise<MediaControlState | null>
  todo: {
    add(text: string): Promise<void>
    toggle(id: string): Promise<void>
    update(id: string, text: string): Promise<void>
    restore(item: TodoItem, index: number): Promise<void>
    remove(id: string): Promise<void>
  }

  // 组件自己的设置（manifest.settings）
  settings: {
    get(): Record<string, unknown>
    set(key: string, value: unknown): void
    onChange(callback: () => void): () => void
  }

  // 存储（permission: storage）
  storage: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    remove(key: string): Promise<void>
  }

  // 命令（permission: commands）
  commands: {
    openUrl(url: string): Promise<void>
    notify(message: string): Promise<void>
    togglePanel(): Promise<void>
    refreshData(): Promise<void>
  }
}
```

### 当前内置 context

Sill 0.5 已经提供：

- `language`、`now`、`snapshot`、`todos`
- `mediaPosition`、`mediaProgress`、`mediaCommand`
- `onAddTodo`、`onToggleTodo`、`onUpdateTodo`、`onRestoreTodo`、`onRemoveTodo`

`settings` / `storage` / `commands` / `size` / `theme` 还没有暴露给内置组件；
这是公开 SDK 要补的层。

## 3. 数据形状

```ts
interface PanelSnapshot {
  cpu: number                 // 0–100
  cores: number
  memPct: number
  memUsed: number             // GB
  memTotal: number
  down: number                // bytes/s
  up: number
  gpu: number | null          // 0–100
  gpuMem: number | null       // MiB
  gpuTotal: number | null
  procs: { name: string; mb: number }[]
  media: MediaSample | null
  weather: WeatherSnapshot | null
  volume: number              // 0–100，-1 = 未就绪
  muted: boolean
  at: number                  // 采样时间戳
}

interface MediaSample {
  title: string
  artist: string
  album: string
  status: 'Playing' | 'Paused' | 'Stopped' | 'Closed' | string
  position: number            // 秒
  duration: number
  app: string
}

interface WeatherSnapshot {
  temp: number | null
  high: number | null
  low: number | null
  code: number                // WMO code
  cityId: string | null
  cityName: string
  auto: boolean
  updatedAt: number
  stale: boolean
  error: boolean
}

interface TodoItem {
  id: string
  text: string
  done: boolean
}
```

### 数据 provider

| provider | 内容 | 权限 |
|---|---|---|
| `time.now` | 本地时间、日期、时区 | `data.time` |
| `system.cpu` | CPU 使用率、核心数 | `data.system` |
| `system.memory` | 内存使用率 / 已用 / 总量 | `data.system` |
| `system.gpu` | GPU 使用率、显存 | `data.system` |
| `system.network` | 上下行 bytes/s | `data.system` |
| `system.processes` | 内存 TOP 进程 | `data.system` |
| `media.nowPlaying` | SMTC 当前会话与进度 | `data.media` |
| `weather.current` | 温度、天气码、最高/最低、城市 | `data.weather` |
| `todo.list` | 待办列表 | `data.todo` |
| `files.picked` | 用户明确选择的文件 | `data.files` |

provider 由宿主采样和缓存；组件不能自己起进程、不能自己访问网络。

## 4. 主题 token

```ts
interface ThemeTokens {
  glass: { alpha: number; tint: number; hue: number }
  accent: string
  accentPale: string
  ink: string
  inkDim: string
  inkFaint: string
  radius: number
  font: { sans: string; serif: string }
}
```

- 组件只能使用 token，不硬编码颜色。
- 中文/英文的字号 token 由宿主按语言解析；组件不能把中文压到 8px。
- 主题切换时 `update` 会收到变化；不要把颜色写进 canvas 后不重绘。

## 5. 尺寸与列

- 卡片宽度由面板列宽决定，连续变化；`size.columns` 是当前 1/2/3 列。
- `spanFor(columns)`（内置组件）或 manifest 的 `span` 建议值决定跨列。
- 组件必须在 320–1180 宽度下没有横向溢出。
- 高度由内容决定；宿主负责滚动，组件不能假设“一屏一定放得下”。
- 不要用 `100vw` / `100vh`；使用容器宽度。

## 6. 事件

| 事件 | 触发 | 组件应做什么 |
|---|---|---|
| `onUpdate` | 数据/主题/语言变化 | 只更新变化部分，避免整树重建 |
| `onShow` | 面板滑入 | 启动动画/刷新 |
| `onHide` | 面板收起 | 停止计时器、动画、请求 |
| `onClick` | 卡片内点击 | 只处理自己的交互 |
| `onHover` | 指针进入卡片 | 可选预览/提示 |

全局快捷键、窗口唤出、Esc、拖拽缩放属于宿主，组件不能注册全局快捷键。

## 7. 错误与降级

- 组件抛错：只替换当前卡片为错误占位，其他卡片不受影响。
- 数据缺失：渲染 `—` / `Loading`，不要抛错。
- 网络失败：保留上一次成功值；`stale` 字段可由组件自行展示。
- 脚本超时/崩溃：销毁 iframe，显示「组件已停止」，可手动重载。
- 组件不能阻止面板收起或拦截 Esc。

## 8. 性能预算

- `mount` < 50 ms；`update` < 8 ms（常规数据）。
- 不使用 `setInterval` 高频轮询（>10 Hz）；用宿主数据快照。
- 动画只用 `transform` / `opacity`；不做 layout thrash。
- 大列表（>100 项）使用脚本组件 + 虚拟化，IR 列表不支持虚拟化。
- 单个组件常驻内存建议 < 8 MB。

## 9. 可访问性

- 所有图标按钮必须有 `aria-label` / `title`。
- 交互元素可用键盘到达；焦点环不能去掉。
- 颜色不是唯一状态表达；完成/错误需要有文字或形状。
- 支持 `prefers-reduced-motion`：动画可关闭，不能依赖动画传达状态。
- 中文最小字号 10.5px；正文 13.5–14px。
