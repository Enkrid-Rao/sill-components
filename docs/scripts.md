# Script components

脚本组件用于 IR 表达不了的绘制或交互：自定义 canvas、复杂动画、特殊输入。

**状态：sandbox 尚未实现。** 下面的 API 是 v1 目标；当前 Sill 只支持内置 React 组件。

## 1. manifest

```json
{
  "schema": 1,
  "id": "sill.counter",
  "name": "Counter",
  "version": "0.1.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.0",
  "type": "script",
  "permissions": ["storage"],
  "ui": "ui/main.js",
  "size": { "w": 384, "h": 160, "minW": 300, "minH": 96 }
}
```

`ui/main.js` 必须是 **ES module**，默认导出一个对象：

```js
export default {
  async mount(ctx) {
    ctx.root.innerHTML = '<button class="count">0</button>'
    const button = ctx.root.querySelector('.count')
    let count = (await ctx.storage.get('count')) ?? 0

    button.addEventListener('click', async () => {
      count += 1
      button.textContent = String(count)
      await ctx.storage.set('count', count)
    })
  },

  update(ctx) {
    // 数据/主题/语言变化；按需重绘
  },

  hide() {
    // 停止动画/计时器
  },

  dispose() {
    // 释放所有资源
  }
}
```

## 2. 沙箱

- 每个脚本组件运行在独立 `<iframe sandbox="allow-scripts">`。
- **没有** `allow-same-origin`：不能读宿主 DOM、cookie、localStorage。
- CSP 禁止外部脚本、`eval`、`new Function`、内联事件处理器（由构建器处理）。
- 不能访问 `require`、`process`、`fs`、`electron`、`ipcRenderer`。
- 不能创建新窗口/`window.open`。
- 网络只能通过 `ctx.fetch`（宿主代理 + 域名白名单），不能直接 `fetch`/`XHR`/`WebSocket`。
- 崩溃或超时只影响当前 iframe；宿主可重载。

## 3. Context API

```ts
interface ScriptContext {
  root: HTMLElement
  language: 'zh' | 'en'
  theme: ThemeTokens
  size: { width: number; columns: 1 | 2 | 3 }

  data: Record<string, () => Promise<unknown>>
  onUpdate(callback: () => void): () => void
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
  }

  fetch(input: string, init?: {
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: string
  }): Promise<{ status: number; text(): Promise<string>; json(): Promise<unknown> }>

  commands: {
    openUrl(url: string): Promise<void>
    notify(message: string): Promise<void>
    togglePanel(): Promise<void>
  }

  log(...args: unknown[]): void
}
```

### 数据

```js
const cpu = await ctx.data.cpu()
// { usage: 42, cores: 32 }
```

只能在 manifest 的 `data` 中声明过的绑定名。provider 返回**快照的深拷贝**，修改不会影响宿主。

### 网络

```js
const response = await ctx.fetch('https://api.example.com/status')
```

- 域名必须在 manifest `network.domains` 中声明（计划字段）。
- 宿主拒绝非 HTTPS、私有 IP、`file://`、`localhost`（开发模式除外）。
- 请求有 8s 超时、50 MB/天配额、简单速率限制。
- Cookie / Authorization 不跨组件共享。

### 存储

- 每个组件按 `id` 隔离，配额 1 MB / 100 keys。
- 值必须是 JSON 可序列化；不能存函数、DOM、Blob。
- 卸载组件默认保留；用户清除组件数据时删除。

## 4. 消息协议

宿主与 iframe 之间只传结构化消息：

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

## 5. 生命周期

- `mount` 只调用一次；异步 mount 必须捕获异常。
- `show` / `hide` 可多次调用；`hide` 后不能继续动画或轮询。
- `dispose` 必须清理所有监听器、计时器、canvas 动画帧。
- 组件不响应全局 Esc；Esc 由宿主处理。

## 6. 限制

- 不能读写宿主 DOM、localStorage、cookie、IndexedDB。
- 不能注册全局快捷键或系统托盘。
- 不能创建 BrowserWindow / WebContentsView。
- 不能读取其他组件的数据或设置。
- 不能加载任意外部脚本；包内脚本必须走 CSP nonce。
- 不能绕过宿主主题 token 硬编码颜色（lint 只警告，不阻止发布，但验收会检查）。

## 7. 开发与调试

计划中的 CLI：

```bash
sill dev ./counter     # 本地挂载 + 热重载 + 开发者面板
sill validate ./counter
sill pack ./counter    # 产出 counter-0.1.0.sill
```

开发者面板会显示：provider 实时值、组件日志、消息往返、内存/帧率、重载按钮。
