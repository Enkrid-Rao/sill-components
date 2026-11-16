# Sill Components

Sill 的组件规范与官方组件目录。这个仓库回答三件事：

> 一个组件长什么样、能拿到什么数据、不能做什么，以及怎么验证它。
> 现在有哪些官方组件，源码在哪。

Repository: <https://github.com/Enkrid-Rao/sill-components>
状态：见 [STATUS.md](STATUS.md)。最后发布的规范 tag 是 `v0.1.0`；当前 `main` 是 v0.2 的收口版本，尚未打 tag。

**先把边界说清楚：** Sill 0.5.1 已经有组件宿主（`WidgetShell` + `WIDGETS` 注册表），
但**声明式 IR 引擎、`.sill` 安装器、脚本沙箱和 CLI 都还没有实现**。
下面所有 IR / runtime / sandbox 内容都是目标契约，不是现在就能跑的能力。
哪些已实现、哪些没有，以 [STATUS.md](STATUS.md) 为准。

---

## 1. 组件是什么

组件是侧边廊里的一张卡片。它只负责「把自己的数据画出来」，不拥有窗口、不直接读设置、
不直接访问文件系统。

```text
layout.json 的 order / spans / hidden
        │
        ▼
   WidgetShell（卡片玻璃、落格、拖拽、跨列）
        │
        ▼
   组件 definition / IR / script
        │
        ▼
   provider 快照（时间、系统、媒体、天气、待办）
```

当前内置组件：`hero`、`system`、`processes`、`media`、`todo`。
说明页在 [widgets/](widgets/)，索引在 [registry/catalog.json](registry/catalog.json)。

---

## 2. 两种组件

| 类型 | 入口 | 适合 | 运行方式 |
|---|---|---|---|
| `declarative` | `ui/layout.json` | 时钟、指标、列表等只读展示，以及少量命令按钮 | 宿主把 IR 编译成 React 节点 |
| `script` | `ui/main.js` | 输入框、逐行动作、自定义绘制 / 动画 | 沙箱 iframe 内运行，通过 `ctx` 通信 |

**v1 的声明式组件只读。** 没有本地状态、输入框、逐行动作；需要这些的组件用脚本。
这不是暂缓，是刻意的范围：先把「怎么画」做对，再谈「怎么改」。细节见 [docs/ir.md](docs/ir.md)。

---

## 3. 包结构

```text
my-widget/
├─ widget.json          # 必需：manifest
├─ ui/
│  ├─ layout.json       # declarative 组件
│  └─ main.js           # script 组件（单文件 ES module）
├─ assets/              # 可选：图片、字体（需声明）
├─ locales/
│  ├─ en.json
│  └─ zh.json
└─ README.md
```

开发时直接用文件夹；发布时打包为 **`.sill`**（zip，根目录就是上面的结构）。
v1 还没有打包器，`sill pack` 是计划中的命令。

最小 manifest：

```json
{
  "schema": 1,
  "id": "sill.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "you",
  "license": "MIT",
  "runtime": ">=0.5.1",
  "engine": ">=0.1.0",
  "type": "declarative",
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/layout.json"
}
```

完整字段见 [docs/manifest.md](docs/manifest.md)。

---

## 4. 最小声明式组件

`ui/layout.json`：

```json
{
  "type": "vstack",
  "gap": 6,
  "children": [
    { "type": "text", "bind": "now.time", "style": "display" },
    { "type": "text", "bind": "now.dateLabel", "style": "caption" }
  ]
}
```

绑定名的根来自 manifest 的 `data[].id`，不是 provider 名。`now.time` 与 `now.dateLabel`
的形状见 [docs/providers.md](docs/providers.md)。

完整示例见 [examples/clock](examples/clock)。

---

## 5. 组件能拿到什么

组件不直接碰 Electron IPC。宿主通过 provider 快照提供：

- `time.now`：时间、日期、时区
- `system.*`：CPU / 内存 / GPU / 网络 / 进程
- `media.nowPlaying`：当前媒体会话
- `weather.current`：天气
- `todo.list`：待办
- 主题 token、语言、尺寸
- 组件设置与存储（需权限）
- 固定命令（打开 URL、通知、收起面板、刷新数据）

字段、单位、可空性、刷新频率见 [docs/providers.md](docs/providers.md)；
运行环境见 [docs/runtime.md](docs/runtime.md)。

---

## 6. 设计约束

1. **本地优先**：组件不绕过宿主直接联网；需要网络时声明 `network` 与 `network.domains`，
   由宿主代理。
2. **无 Node**：组件不能 `require`、不能读文件、不能创建窗口。
3. **不抢焦点**：Sill 是瞬态侧边廊，组件不能主动把窗口抢到前台；输入框只在用户点击后聚焦。
4. **可回退**：组件崩溃只影响当前卡片，不拖垮面板。
5. **可读优先**：中文小字不得低于 10.5px；正文 13.5–14px。具体规则见 Sill 的
   `docs/DEVELOPMENT.md` §7.1。
6. **尺寸自适应**：卡片内容宽约 185–1110px，不是 320–1180。最窄的 185px 出现在三列单跨；
   组件必须允许内容换行 / 截断，不能假设固定宽度。
7. **不写死颜色 / 圆角**：使用宿主 token，不要在组件里硬编码主题色；IR 没有 `color` 参数。
8. **不用 `backdrop-filter`**：玻璃只有宿主这一种，组件不能自己采样桌面。

---

## 7. 官方组件

| id | 名称 | 类型 | 数据 | 可安装 |
|---|---|---|---|---|
| `sill.hero` | 头图 | builtin | 时间、天气 | 否 |
| `sill.system` | 系统 | builtin | CPU / 内存 / GPU / 网络 | 否 |
| `sill.processes` | 进程 | builtin | 进程、显存 | 否 |
| `sill.media` | 媒体 | builtin | SMTC、音量 | 否 |
| `sill.todo` | 待办 | builtin | 待办 | 否 |

它们随 Sill 0.5.1 发布，但都是宿主内置实现，不是 `.sill` 包。
目录、状态与迁移计划见 [registry/README.md](registry/README.md)。

---

## 8. 文档

| 文档 | 内容 |
|---|---|
| [STATUS.md](STATUS.md) | 现在有什么、没有什么、兼容矩阵 |
| [CHANGELOG.md](CHANGELOG.md) | 每个规范版本改了什么 |
| [docs/manifest.md](docs/manifest.md) | `widget.json` 字段、校验、权限、路径 |
| [docs/ir.md](docs/ir.md) | IR 节点、绑定表达式、样式 token、v1 范围 |
| [docs/runtime.md](docs/runtime.md) | 生命周期、环境、尺寸、主题、性能 |
| [docs/providers.md](docs/providers.md) | 每个 provider 的字段、单位、权限 |
| [docs/scripts.md](docs/scripts.md) | 脚本组件与沙箱 API |
| [docs/security.md](docs/security.md) | 权限、CSP、存储、网络边界 |
| [docs/testing.md](docs/testing.md) | 验收清单与测试方法 |
| [docs/roadmap.md](docs/roadmap.md) | 从规范到引擎 / CLI / 安装器 |
| [registry/README.md](registry/README.md) | 官方目录与提交规则 |
| [spec/widget.schema.json](spec/widget.schema.json) | manifest 的 JSON Schema |
| [spec/layout.schema.json](spec/layout.schema.json) | IR 的 JSON Schema |
| [spec/catalog.schema.json](spec/catalog.schema.json) | 目录的 JSON Schema |
| [spec/commands.json](spec/commands.json) | 命令目录 |
| [spec/providers.json](spec/providers.json) | provider 目录 |

---

## 9. 快速开始（当前阶段）

引擎落地前，能做的只有「写对契约、通过校验」：

1. 按 [examples/clock](examples/clock) 写 manifest 与 IR；
2. 把组件放进一个文件夹（不必在 `examples/` 下），跑：

   ```bash
   python scripts/validate.py ./my-widget
   ```

   不带参数时会检查所有示例、目录、fixtures；带路径时只检查那个组件；
3. 在目录里加一条 `registry/catalog.json` 条目（可选，`installable` 保持 `false`）；
4. 等 `packages/engine` 的 `validate` / `compile` 落地后，再把 IR 挂到宿主。

计划中的命令：

```bash
sill validate ./my-widget
sill dev ./my-widget
sill pack ./my-widget
```

---

## 10. 版本与兼容

- `schema` 目前固定 `1`。
- `runtime` 是宿主应用范围；`engine` 是组件引擎范围。两个都满足才加载。
- 破坏性 manifest / IR 变更必须升 `schema` 与 `engine` 主版本，并提供迁移器。
- 新增可选字段不升 `schema`，但要提高 `engine` 的最低版本；旧宿主会拒绝未知字段，
  安装器应提示更新，而不是静默忽略。
- 组件版本遵循 semver；宿主只按 `id` 识别组件，不按路径。
- 目录条目的版本与 Sill 版本无关；`source.ref` 指向发布标签。

---

## 11. 许可

本仓库的规范、目录与示例采用 MIT。组件作者可以给自己的组件选择其他许可证，但必须在
`widget.json` 的 `license` 字段声明。
