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
        │ 只读文本绑定
模板内容（无 JS、无网络）
```

- 模板不接触 Electron IPC；
- 模板不执行 JS；
- 模板不能读文件、不能发网络请求；
- 模板只拿到 manifest 声明的 provider 文本。

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
| `data.todo` | 中 | 只读待办；v1 不能改 |

- 权限在安装时展示，不能静默升级。
- 未声明的数据不进入模板。
- v1 没有 `storage` / `network` / `commands` / `settings`。

## 6. 包与路径

- 拒绝 `..`、绝对路径、Windows 盘符、UNC、反斜杠、符号链接逃逸。
- `.sill` 解压限制：总解压 ≤ 50 MB、文件数 ≤ 500、单文件 ≤ 10 MB；
  这是防御 zip bomb 的安全上限，不是包策略。
- 包策略：总资源 ≤ 10 MB、文件数 ≤ 200、单文件 ≤ 512 KB；超过拒绝安装。
- 只允许 `widget.json`、`ui/index.html`、`ui/style.css` 和可选 README；
  其他文件不进入安装目录。
- 安装使用临时目录 + 原子 rename；失败不留下半个包。
- 组件目录名由 `id@version` 生成，不信任压缩包内目录名。
- 路径相对于宿主的 `userData`；不要假设一定是 `%APPDATA%`，便携版会改到 exe 旁。

## 7. 安装与更新

- 安装前展示：id、名称、版本、作者、权限、大小、来源。
- v1 不做代码签名，也不做自动下载。用户选择本地 `.sill` 文件后确认安装；
  目录里的 `installable: false` 条目不能被当成可安装组件。
- 更新只允许同 `id`；新增权限需重新确认。
- 卸载删除组件目录；不碰用户数据。
- 目录里的 `verified` 只代表按规范检查过，不代表作者可信。

## 8. 后续：JS 组件

任意 JS 不放进模板，也不放进宿主 DOM。未来如果需要脚本组件，必须单独设计：

- 独立 iframe / WebContentsView 沙箱；
- CSP、MessagePort、权限代理；
- 不能因为“想要动态效果”就取消模板的白名单。

## 9. 审计与报告

审计日志记录：

- 安装 / 卸载 / 更新
- 权限拒绝
- 模板拒绝（标签 / 属性 / CSS / 大小）
- 数据绑定失败

格式为 JSONL，写在 `<userData>/audit/`，保留 14 天，不含组件正文与用户内容。
用户可以一键清除。

发现漏洞请通过仓库 issue 私下联系维护者，不要公开利用细节。
