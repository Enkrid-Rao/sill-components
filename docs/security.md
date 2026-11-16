# Security model

组件的默认假设：**代码不可信**。它由第三方编写，可能出错，也可能恶意。

## 1. 资产

要保护的东西：

- 用户的文件系统、剪贴板、浏览器会话、其他应用数据。
- Sill 的设置、待办、天气地区、布局。
- 面板的窗口句柄、置顶层、热键。
- 其他组件的数据与存储。

组件不应该获得任何一项的默认访问权。

## 2. 边界

```text
┌──────────────────────────────┐
│ 主进程（Node / Electron）      │  ← 只有这里能碰 fs / 窗口 / 网络 / 子进程
│  settings / todo / weather    │
└──────────────┬───────────────┘
               │ 受控 IPC
┌──────────────▼───────────────┐
│ Renderer（React 宿主）         │
│  WidgetShell / IR / 内置组件   │
└──────────────┬───────────────┘
               │ MessagePort + 结构化消息
┌──────────────▼───────────────┐
│ sandbox iframe（脚本组件）      │  ← 无 same-origin、无 Node、无直接网络
└──────────────────────────────┘
```

- 声明式 IR 不执行代码；只做受限求值与节点渲染。
- 脚本组件永远在 iframe 内；宿主不把 `window` / `document` 传进去。
- 组件不能直接调用主进程 IPC；所有能力走 context 方法。
- 包内资源通过只读的 `sill-widget://` 协议读取，按 manifest `assets` 白名单放行。

## 3. 权限

| 权限 | 风险 | 控制 |
|---|---|---|
| `data.time` | 低 | 只读本地时间 |
| `data.system` | 中 | 只读聚合指标，不暴露进程路径 / 命令行 / PID |
| `data.media` | 中 | 只读当前会话，并允许发送播放控制；安装时明确提示 |
| `data.weather` | 低 | 只读天气快照；不暴露精确坐标 |
| `data.todo` | 中 | 可读写待办；安装时明确提示 |
| `storage` | 低 | 按组件隔离，有配额 |
| `network` | 高 | 域名白名单、HTTPS、限速、配额；默认拒绝私网 |
| `commands` | 中 | 只允许固定命令；`app.openUrl` 只允许 https |
| `settings` | 低 | 只读写组件自己的设置 |

- 权限在安装时展示，不能静默升级。
- 组件升级新增权限时必须重新征得用户同意。
- 未声明的调用直接拒绝并记审计日志。
- `data.files` 不在 v1。文件选择器与真实路径的边界还没设计好；在 opaque handle 方案落地前不发放。

## 4. 路径与包

- 拒绝 `..`、绝对路径、Windows 盘符、UNC、反斜杠、符号链接逃逸。
- `.sill` 解压限制：总解压 ≤ 50 MB、文件数 ≤ 500、单文件 ≤ 10 MB；
  这是防御 zip bomb 的安全上限，不是包策略。
- 包策略：总资源 ≤ 10 MB、文件数 ≤ 200、单文件 ≤ 2 MB；超过拒绝安装。
- 只允许 manifest 声明的资源；其他文件不进入安装目录。
- 安装使用临时目录 + 原子 rename；失败不留下半个包。
- 组件目录名由 `id@version` 生成，不信任压缩包内目录名。
- 路径相对于宿主的 `userData`；不要假设一定是 `%APPDATA%`，便携版会改到 exe 旁。

## 5. 脚本沙箱

- iframe `sandbox="allow-scripts"`，**不加** `allow-same-origin`。
- 宿主用 `srcdoc` 创建空白文档，把单文件 ES module 以 nonce 注入。
- CSP：`default-src 'none'; script-src 'nonce-<random>'; style-src 'unsafe-inline'; img-src sill-widget: data:; font-src sill-widget:; connect-src 'none'; base-uri 'none'; form-action 'none'`。
- 禁止 `eval` / `new Function` / `document.write`（CSP + 运行时检查）。
- 禁止 `window.open`、`top.location`、`parent.document`。
- 超时：`mount` 5s，单次 `update` 100ms，消息 5s；超时销毁 iframe。
- 内存：单组件 64 MB 上限；超过提示并停止。
- 崩溃隔离：一个组件崩溃不影响其他卡片；错误占位可手动重载。
- 通信走 `MessagePort`，不使用 `postMessage('*')`；不透明源不能作为鉴权依据。

## 6. 网络

- 只通过 `ctx.fetch`；域名白名单在 manifest `network.domains` 中声明。
- 只允许 HTTPS；开发模式可显式允许 localhost。
- 拒绝私有地址段（10/8、172.16/12、192.168/16、127/8、169.254/16、IPv6 ULA / link-local）。
  检查发生在 DNS 解析之后，不只是看主机名。
- 每一跳重定向都重新检查域名与解析后的 IP，防止用公网域名跳到私网。
- 不允许自定义 `Cookie`、`Authorization` 跨域转发；不共享宿主 cookie。
- 超时 8s；单次响应 2 MB；每天 50 MB；按域名限速。
- 响应体不写入组件可访问的磁盘；只返回文本 / JSON。

## 7. 存储

- 按组件 `id` 隔离；不能读其他组件。
- 5 MB / 200 keys / 单值 256 KB；超出拒绝并提示。
- 值必须 JSON；拒绝 `__proto__` / `constructor` 原型污染键。
- 升级保留；**卸载删除组件目录与组件存储**。不碰用户待办、全局设置与布局。
- 用户可以在设置里单独清除某个组件的数据。
- 存储是可读的本地文件；不要在里面放凭证或敏感信息。

## 8. 安装与更新

- 安装前展示：id、名称、版本、作者、权限、网络域名、大小、来源。
- v1 不做代码签名，也不做自动下载。用户选择本地 `.sill` 文件后确认安装；
  目录里的 `installable: false` 条目不能被当成可安装组件。
- 更新只允许同 `id`；新增权限需重新确认。
- 卸载删除组件目录与组件存储；不碰用户数据。
- 组件不能修改 Sill 的全局设置或布局，除非有明确的命令权限。
- 目录里的 `verified` 只代表按规范检查过，不代表作者可信。

## 9. 审计与报告

审计日志记录：

- 安装 / 卸载 / 更新
- 权限拒绝
- 网络请求（域名、状态、大小，不含正文）
- 脚本超时 / 崩溃
- 存储配额拒绝

格式为 JSONL，写在 `<userData>/audit/`，保留 14 天，不含组件正文与用户内容。
用户可以一键清除。

发现漏洞请通过仓库 issue 私下联系维护者，不要公开利用细节。
