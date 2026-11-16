# Script components

脚本组件用于 IR 表达不了的绘制或交互：自定义 canvas、复杂动画、输入框、逐行操作。
v1 的声明式 IR 只读，所以**所有交互型组件都先走脚本**。

**状态：sandbox 尚未实现。** 下面的 API 是 v1 目标；当前 Sill 只支持内置 React 组件。
不要按这份文档去写一个现在就能加载的脚本组件——它还不能运行。

## 1. manifest

```json
{
  "schema": 1,
  "id": "sill.counter",
  "name": "Counter",
  "version": "0.1.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.1",
  "engine": ">=0.1.0",
  "type": "script",
  "permissions": ["storage"],
  "ui": "ui/main.js",
  "size": { "w": 384, "h": 160 }
}
```

`ui/main.js` 必须是**单文件 ES module**，默认导出一个对象。v1 不允许相对 `import`：
需要拆文件就在构建时 bundle 成一个入口。这样可以避免不透明源下的模块解析与 CORS 问题。

```js
export default {
  async mount(ctx) {
    ctx.root.innerHTML = '<button class="count" type="button">0</button>'
    const button = ctx.root.querySelector('.count')
    let count = (await ctx.storage.get('count')) ?? 0

    const paint = () => {
      button.textContent = String(count)
    }
    paint()

    button.addEventListener('click', async () => {
      count += 1
      paint()
      await ctx.storage.set('count', count)
    })
  },

  update(ctx, payload) {
    // 数据 / 主题 / 语言 / 尺寸变化；按 payload.changed 增量重绘
  },

  hide() {
    // 停止动画 / 计时器
  },

  dispose() {
    // 释放所有资源
  }
}
```

## 2. 沙箱

- 每个脚本组件一个独立 `<iframe sandbox="allow-scripts">`。
- **没有** `allow-same-origin`：不能读宿主 DOM、cookie、localStorage、IndexedDB。
- 宿主用 `srcdoc` 创建空白文档，把 `main.js` 作为带 nonce 的内联 module 注入。
- CSP：

  ```text
  default-src 'none';
  script-src 'nonce-<random>';
  style-src 'unsafe-inline';
  img-src sill-widget: data:;
  font-src sill-widget:;
  connect-src 'none';
  base-uri 'none';
  form-action 'none'
  ```

- 包内资源通过 `sill-widget://<id>/assets/...` 读取；该协议只读、无目录列表、按 manifest `assets` 白名单放行。
- 不能访问 `require`、`process`、`fs`、`electron`、`ipcRenderer`。
- 不能创建新窗口 / `window.open`。
- 网络只能通过 `ctx.fetch`（宿主代理 + 域名白名单），不能直接 `fetch` / `XHR` / `WebSocket`。
- 崩溃或超时只影响当前 iframe；宿主可重载。
- 宿主通过 `MessagePort` 与 iframe 通信，不使用 `postMessage('*')`；iframe 的 `event.origin` 是不透明源，
  不能用来鉴权。

## 3. Context API

```ts
interface ScriptContext {
  root: HTMLElement
  language: 'zh' | 'en'
  now: Date
  size: { width: number; columns: 1 | 2 | 3 }
  theme: ThemeTokens
  reducedMotion: boolean

  data: Record<string, () => Promise<unknown>>
  onUpdate(callback: (payload: UpdatePayload) => void): () => void
  onShow(callback: () => void): () => void
  onHide(callback: () => void): () => void

  storage: {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    remove(key: string): Promise<void>
  }

  settings: {
    get(): Record<string, unknown>
    set(key: string, value: unknown): Promise<void>
    onChange(callback: () => void): () => void
  }

  fetch(input: string, init?: {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: string
  }): Promise<{ status: number; text(): Promise<string>; json(): Promise<unknown> }>

  command(name: string, args?: Record<string, unknown>): Promise<unknown>
  log(...args: unknown[]): void
}

interface UpdatePayload {
  reason: 'data' | 'theme' | 'language' | 'size' | 'settings'
  changed: string[]
}
```

### 数据

```js
const cpu = await ctx.data.cpu()
// { usage: 42, cores: 32 }
```

- 键是 manifest `data[].id`，不是 provider 名。
- 只能访问声明过的短名；未声明的 key 直接拒绝。
- provider 返回**深拷贝**，修改不会影响宿主。
- `onUpdate` 的 `changed` 是短名数组；只重绘变化的部分。
- 不要在 `mount` 里轮询；需要刷新时用 `onUpdate`，或调 `command('data.refresh')`。

### 网络

```js
const response = await ctx.fetch('https://api.example.com/status')
```

- 域名必须在 manifest `network.domains` 中声明，且声明 `network` 权限。
- 只允许 HTTPS；拒绝私有 IP、回环、链路本地、`file://`、`localhost`（开发模式例外，需显式开关）。
- 请求 8s 超时，单次响应 2 MB，每天 50 MB；超限拒绝。
- 重定向逐跳检查域名与解析后的 IP。
- Cookie / Authorization 不跨组件共享；不能自定义 `Cookie`。
- 响应只返回文本 / JSON，不落盘。

### 存储

- 每个组件按 `id` 隔离，配额 5 MB / 200 keys / 单值 256 KB。
- 值必须 JSON 可序列化；不能存函数、DOM、Blob。
- 拒绝 `__proto__` / `constructor` 键。
- 升级保留；卸载删除。用户也可以在设置里清除单个组件数据。

### 设置

- `get()` 返回当前组件的设置对象，键与 `manifest.settings[].key` 一致。
- `set()` 异步写盘；成功后触发一次 `onUpdate({ reason: 'settings' })`。
- 声明式组件用 `settings.<key>` 绑定，不使用这套方法。

### 命令

```js
await ctx.command('todo.add', { text: 'Buy milk' })
await ctx.command('media.playpause')
```

- 命令名必须在 [`spec/commands.json`](../spec/commands.json) 中。
- 命令所需的权限必须在 manifest 中声明；否则 reject。
- 参数按命令 schema 校验；多余参数拒绝。
- 命令失败时抛错，组件自己决定怎么提示；不要假设命令一定成功。

## 4. 消息协议

宿主与 iframe 之间只传结构化消息，走 `MessagePort`：

```ts
type HostMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'update'; payload: UpdatePayload }
  | { type: 'show' | 'hide' | 'dispose' }
  | { type: 'response'; id: number; ok: boolean; value?: unknown; error?: string }

type ComponentMessage =
  | { type: 'ready' }
  | { type: 'request'; id: number; method: string; params?: unknown }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
```

- 每条消息必须带 `type`；未知消息丢弃并记日志。
- `id` 由组件生成，宿主原样回传；请求超时 5s。
- 不允许传递函数、DOM、原型链对象。
- 宿主校验 `method` 是否在允许列表内；不在则拒绝。
- `init` 通过 `MessageChannel` 转移端口，不通过 `window.postMessage` 传敏感数据。

## 5. 生命周期

- `mount` 只调用一次；异步 mount 必须捕获异常。
- `show` / `hide` 可多次调用；`hide` 后不能继续动画或轮询。
- `dispose` 必须清理所有监听器、计时器、canvas 动画帧。
- 组件不响应全局 Esc；Esc 由宿主处理。输入框自己处理组合态与取消。
- 主题 / 语言变化只触发 `update`，不整页重载；组件要能增量重绘。

## 6. 限制

- 不能读写宿主 DOM、localStorage、cookie、IndexedDB。
- 不能注册全局快捷键或系统托盘。
- 不能创建 BrowserWindow / WebContentsView。
- 不能读取其他组件的数据或设置。
- 不能加载任意外部脚本；包内脚本必须单文件 + nonce。
- 不能绕过宿主主题 token 硬编码颜色（lint 只警告，不阻止发布，但验收会检查）。
- 不能使用 `backdrop-filter` 或任何桌面采样；玻璃只有宿主提供的这一种。

## 7. 开发与调试

计划中的 CLI：

```bash
sill validate ./counter
sill dev ./counter     # 本地挂载 + 热重载 + 开发者面板
sill pack ./counter    # 产出 counter-0.1.0.sill
```

开发者面板会显示：provider 实时值、组件日志、消息往返、内存 / 帧率、重载按钮。
`ctx.log()` 的输出只进开发者面板，不进用户界面。

## 8. 迁移到 v1 之后

0.5.1 的内置组件用的是 React context，不是这份 API。迁移时注意：

- `context.snapshot` 拆成 `ctx.data.<id>()`；
- `onAddTodo` 等回调改成 `ctx.command('todo.add', …)`；
- `theme` / `size` / `settings` / `storage` 是新加的，不要从 DOM 里猜；
- 不要照抄 `mediaPosition` / `mediaProgress`，它们已经并入 `media.nowPlaying`。

内置组件源码只能当行为参考，不能当 API 参考。
