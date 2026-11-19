# 信任模型

Sill 的组件模型参考 Rainmeter：**组件是本地可信代码，安装或放进 Skins 目录就是授权**。
宿主不做运行时权限强制，也不试图把恶意组件关进笼子——那会让每个正常组件都付出代价。

## 1. 和 Rainmeter 的对应

| Rainmeter | Sill |
|---|---|
| `Skins/<名字>/` 文件夹 | `<userData>/skins/<名字>/`，放进去自动刷新 |
| `.rmskin` 安装包 | `.sill`（zip），安装到 `<userData>/components/<id>@<version>/` |
| `.ini` + 可选 Lua | `ui/index.html` + `ui/style.css` + 可选 `ui/main.js` |
| `@Resources` 相对路径 | `ui/assets/**`，改写为 `sill-asset://<id>/ui/...` |
| 插件 DLL | `type: "web"` + `trust: "trusted"`（完整 Node） |
| 安装时按能力提示一次 | 安装时按 `static / script / isolated / node` 分档提示；`trust.json` 记住确认，能力不变不再问 |

## 2. 边界

```text
主进程（Node / Electron）
  settings / todo / weather / provider 快照 / 组件存储
        │ IPC
Renderer（React 宿主）
  WidgetShell / .card / Shadow DOM
        ├─ template：同页 HTML/CSS + 可选 main.js（可信）
        └─ web guest：隔离（无 Node）/ trusted 完整 Node
```

- template 与宿主同页：`on*`、`ui/main.js` 都能访问 `window.sill`；
- `ui/main.js` 是宿主页面里的一段脚本，不是沙箱；
- `type: "web"` 才拥有独立 guest；`trust: "trusted"` 有完整 Node；
- web 的隔离模式（默认，无 Node）：桥 + `sill.storage` + `https:` 网络，每个组件独立
  `sill-widget-<id>` partition；它拿不到宿主 DOM，也不需要为系统能力单独开接口。

## 3. 组件能做什么

- 读宿主提供的所有数据（`host.state` 直接给整份快照）；
- 读写自己的私有 JSON（`sill.storage` → `<userData>/widget-data/<id>.json`）；
- 通过 `sill.host` 调宿主 preload API；
- 访问自己包内的图片 / 字体（`sill-asset://`）；
- template 的 `on*` 与 `main.js` 可以访问页面全局对象。

不在防护范围内的：恶意组件读取用户文件、发网络请求、改设置。用户只应安装信任来源的组件，
和安装 Rainmeter 皮肤、VS Code 扩展是同一类决定。

## 4. 仍然保留的检查

这些是防手滑和防坏包，不是安全边界：

- 拒绝 `..`、绝对路径、盘符、UNC、反斜杠；
- `.sill` 单文件 20 MB、总包 50 MB、文件数上限；
- 安装使用临时目录 + 原子 rename；
- `runtime` / `engine` 版本不匹配时拒绝加载，并给出明确错误；
- 资源协议只允许读组件目录内的文件。

## 5. 数据层

`data` / `permissions` 仍然写在 manifest 里，但用途是：

- 让目录页和安装对话框能说清「这个卡读什么」；
- 让 provider 有稳定的字段契约，组件不用猜宿主快照；
- 不是运行时门禁。`host.state` 可以一次拿到全部，`permissions` 不阻止它。

## 6. 安装与分发

- 本地 `.sill` 安装：显示 id / 版本 / 作者 / 类型，确认后写入；
- Skins 目录：不需要安装，保存即刷新；
- 目录下载已可用（https 直链 + 只读目录）；签名 / 哈希仍未实现；
- 同一个 `id` 只允许一个安装版本；skins 目录里的同名 id 优先于安装版本。

## 7. 报告

发现会让宿主意外崩溃、丢数据或绕过资源目录的问题，请通过仓库 issue 私下联系维护者。
普通的功能缺陷直接开 issue 即可。
