# Sill Components

Sill 的组件开发规范与示例。这个仓库回答一件事：

> 一个第三方组件长什么样、能拿到什么数据、不能做什么，以及怎么验证它。

**状态：spec v0.1（2026-11）。**
Sill 0.5 的宿主已经跑通「内置组件注册表」（`WIDGETS` / `WidgetShell`），
但**声明式 IR 引擎、`.sill` 安装器、脚本沙箱和 CLI 还没有实现**。
本仓库先把契约写清楚，作为下一步 `packages/engine` 的验收目标；文档中会明确标注
「已实现 / 计划中」，不把规划当成能力。

---

## 1. 组件是什么

组件是侧边廊里的一张卡片。它只负责「把自己的数据画出来」，不拥有窗口、不直接读设置、
不直接访问文件系统。

```
layout.json 的 order / spans / hidden
        │
        ▼
   WidgetShell（卡片玻璃、落格、拖拽、跨列）
        │
        ▼
   组件 definition / IR / script
        │
        ▼
   WidgetContext（语言、时间、系统快照、媒体、待办、命令）
```

当前内置组件：`hero`、`system`、`processes`、`media`、`todo`。
它们都在 `apps/desktop/src/renderer/src/widgets/registry.tsx` 注册。

---

## 2. 两种组件

| 类型 | 入口 | 适合 | 运行方式 |
|---|---|---|---|
| `declarative` | `ui/layout.json` | 时钟、指标、列表、简单表单 | 宿主把 IR 编译成 React 节点 |
| `script` | `ui/main.js` | 需要自定义绘制 / 交互的组件 | 沙箱 iframe 内运行，通过 `ctx` 通信 |

声明式优先。只有 IR 表达不了的东西才用脚本。

---

## 3. 包结构

```
my-widget/
├─ widget.json          # 必需：manifest
├─ ui/
│  ├─ layout.json       # declarative 组件
│  └─ main.js           # script 组件
├─ assets/              # 可选：图片、字体（需声明）
├─ locales/
│  ├─ en.json
│  └─ zh.json
└─ README.md
```

开发时直接用文件夹；发布时打包为 **`.sill`**（zip，根目录就是上面的结构）。

最小 manifest：

```json
{
  "schema": 1,
  "id": "sill.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.0",
  "type": "declarative",
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/layout.json"
}
```

完整字段见 [docs/manifest.md](docs/manifest.md)。

---

## 4. 最小声明式组件

`widget.json`：

```json
{
  "schema": 1,
  "id": "sill.hello",
  "name": "Hello",
  "version": "0.1.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.0",
  "type": "declarative",
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/layout.json"
}
```

`ui/layout.json`：

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

完整示例见 [examples/clock](examples/clock)。

---

## 5. 组件能拿到什么

组件不直接碰 Electron IPC。宿主通过 `WidgetContext` 提供：

- `language`：`zh` / `en`
- `now`：当前时间（每秒/分钟由宿主驱动）
- `snapshot`：系统、媒体、天气等只读快照
- `todos`：待办列表与增删改命令
- 主题 token（玻璃、强调色、字号）

数据形状见 [docs/runtime.md](docs/runtime.md) 和 [docs/ir.md](docs/ir.md)。

---

## 6. 设计约束

1. **本地优先**：组件不绕过宿主直接联网；需要网络时声明 `network` 权限，由宿主代理。
2. **无 Node**：组件不能 `require`、不能读文件、不能创建窗口。
3. **不抢焦点**：Sill 是瞬态侧边廊，组件不能主动把窗口抢到前台。
4. **可回退**：组件崩溃只影响当前卡片，不拖垮面板。
5. **可读优先**：中文小字不得低于 10.5px；具体 token 见 Sill 的 `docs/DEVELOPMENT.md` §7.1。
6. **尺寸自适应**：卡片宽度会从 320 连续变到 1180；组件必须允许内容换行/截断，不能假设固定宽度。
7. **不写死颜色**：使用宿主 token，不要在组件里硬编码主题色。

---

## 7. 文档

| 文档 | 内容 |
|---|---|
| [docs/manifest.md](docs/manifest.md) | `widget.json` 字段、校验、权限 |
| [docs/ir.md](docs/ir.md) | IR 节点、绑定表达式、样式 token |
| [docs/runtime.md](docs/runtime.md) | 生命周期、Context、事件、数据 provider |
| [docs/scripts.md](docs/scripts.md) | 脚本组件与沙箱 API |
| [docs/security.md](docs/security.md) | 权限、CSP、存储、网络边界 |
| [docs/testing.md](docs/testing.md) | 验收清单与测试方法 |
| [docs/roadmap.md](docs/roadmap.md) | 从规范到引擎 / 安装器 / CLI |
| [spec/widget.schema.json](spec/widget.schema.json) | manifest 的 JSON Schema |

---

## 8. 快速开始（当前阶段）

在 IR 引擎落地前，第三方组件还无法直接加载。现在可以：

1. 按 [examples/clock](examples/clock) 写 manifest 和 IR；
2. 用 `spec/widget.schema.json` 自查 manifest；
3. 在 Sill 仓库里用内置 registry 做一个同构组件，验证布局与数据；
4. 等 `packages/engine` 的 `validate` / `compile` 落地后，把 IR 直接挂到宿主。

计划中的命令：

```bash
sill validate ./my-widget
sill dev ./my-widget
sill pack ./my-widget
```

---

## 9. 版本与兼容

- `schema` 目前固定 `1`。
- `runtime` 是宿主 semver 范围；不满足会在安装/加载时拒绝。
- 破坏性 manifest / IR 变更必须升 `schema`，并提供迁移器。
- 组件版本遵循 semver；宿主只按 `id` 识别组件，不按路径。

---

## 10. 许可

本仓库的规范与示例采用 MIT。组件作者可以给自己的组件选择其他许可证，但必须在
`widget.json` 的 `license` 字段声明。
