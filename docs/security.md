# Security model

模板组件的默认假设：**模板内容不可信**。它由第三方编写，可能包含脚本、外链、
过深嵌套或超大文本。宿主不执行模板里的代码。

## 1. 资产

要保护的东西：

- 用户的文件系统、剪贴板、浏览器会话、其他应用数据。
- Sill 的设置、待办、天气地区、布局。
- 面板的窗口句柄、置顶层、热键。
- 其他组件的数据与存储。

模板不应该获得任何一项的默认访问权。

## 2. 边界

```text
主进程（Node / Electron）
  settings / todo / weather / provider 快照
        │ 受控 IPC
Renderer（React 宿主）
  WidgetShell / .card / Shadow DOM 模板
        │ 只读文本 / 条件 / 列表
template（无 JS、无网络） / web guest（按 trust）
```

- 模板不接触 Electron IPC；
- template 不执行 JS；web 在独立 guest 里跑 JS，trusted 拥有完整 Node。
- 模板不能读文件、不能发网络请求；
- 模板只拿到 manifest 声明的 provider 数据。

## 3. HTML 白名单

允许标签：

```text
div span p section ul ol li strong em small b i br h1 h2 h3 h4
```

允许属性：

```text
class id role aria-* data-sill-*
```

禁止：

- `<script>` / `<style>` / `<link>` / `<iframe>` / `<object>` / `<embed>` / `<img>` / `<svg>`；
- `on*` 事件属性；
- `style` 属性、`href`、`src`；
- 自定义标签、表单控件、媒体元素。

未知标签整段移除；未知属性删除。v1 的 sanitizer 是白名单，不是黑名单。

## 4. CSS 限制

- 只允许 `ui/style.css`，挂在 Shadow DOM 内；
- 禁止 `@import`；
- 禁止 `url()`（远程图片、字体、背景）；
- 禁止 `expression()` / `javascript:` / `behavior:`；
- 文件 ≤ 512 KB；
- 不使用 `backdrop-filter`、桌面采样或 `position:fixed` 逃出卡片。

## 5. 数据权限

| 权限 | 风险 | 控制 |
|---|---|---|
| `data.time` | 低 | 只读本地时间 |
| `data.system` | 中 | 只读聚合指标，不暴露进程路径 / 命令行 / PID |
| `data.media` | 中 | 只读当前会话 |
| `data.weather` | 低 | 只读天气快照；不暴露精确坐标 |
| `data.todo` | 中 | 只读待办 |
| `action.media` | 中 | 播放控制；不暴露其他应用 |
| `action.todo` | 中 | 只能切换完成状态，不能删除 / 批量改 |

- 权限在安装时展示，不能静默升级。
- 未声明的数据不进入模板。
- v1 没有 `storage` / `network` / `settings`。

## 6. 包与路径

- 拒绝 `..`、绝对路径、Windows 盘符、UNC、反斜杠、符号链接逃逸。
- `.sill` 限制：压缩包 ≤ 10 MB、单文件 ≤ 512 KB、只允许 3 个文件；超过拒绝安装。
- template 只允许 `widget.json`、`ui/index.html`、`ui/style.css`；
- web 额外允许 `ui/main.js`；其他文件直接拒绝。
- 安装使用临时目录 + 原子 rename；失败不留下半个包。
- 组件目录名由 `id@version` 生成，不信任压缩包内目录名。
- 路径相对于宿主的 `userData`；不要假设一定是 `%APPDATA%`，便携版会改到 exe 旁。

## 7. 安装与更新

- 安装前显示 id、名称、版本、作者、权限和提醒，确认后才写入。
- v1 不做代码签名，也不做自动下载。用户选择本地 `.sill` 文件并确认后安装；
  目录里的 `installable: false` 条目不能被当成可安装组件。
- 同一个 `id` 只允许一个版本；升级要先卸载再安装。
- 卸载删除组件目录，并把 id 从布局移除；不碰用户数据。
- 目录里的 `verified` 只代表按规范检查过，不代表作者可信。

## 8. JS 组件

JS 不放进 template，也不放进宿主 DOM。`type: "web"` 的 JS 在独立 webview 里：

- `trust: "sandboxed"`：CSP、preload 桥、权限动作，无 Node / 文件 / 网络；
- `trust: "trusted"`：完整 Node，和 Rainmeter 插件同级权限；安装时显示完全信任警告；
- 主进程 `will-attach-webview` 只接受 data URL，并根据 host 设置的 partition 决定信任级别；
- 不能因为组件想读系统就把它塞进宿主 renderer。

## 9. 审计与报告（计划）

审计日志还没实现。计划记录：

- 安装 / 卸载 / 更新
- 权限拒绝
- 模板拒绝（标签 / 属性 / CSS / 大小）
- 数据绑定失败

格式为 JSONL，写在 `<userData>/audit/`，保留 14 天，不含组件正文与用户内容。
用户可以一键清除。

发现漏洞请通过仓库 issue 私下联系维护者，不要公开利用细节。
