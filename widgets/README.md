# 组件

这里放每个组件的说明页。索引数据在 [`registry/catalog.json`](../registry/catalog.json)，
每个条目的 `docs` 指回本目录。

| id | 一句话 | 类型 | 可安装 |
|---|---|---|---|
| [sill.hero](sill.hero/README.md) | 日期、时钟、天气 | builtin | 否 |
| [sill.system](sill.system/README.md) | CPU / 内存 / GPU / 网络 | builtin | 否 |
| [sill.processes](sill.processes/README.md) | TOP RAM 与显存 | builtin | 否 |
| [sill.media](sill.media/README.md) | 正在播放与音量 | builtin | 否 |
| [sill.todo](sill.todo/README.md) | 本地待办 | builtin | 否 |

这五个都随 Sill 0.5.1 发布，但都还是宿主内置实现。`installable: false` 是准确的：
它们没有 `.sill` 包，也不应该被安装器当成可下载组件。

## 什么时候会有可安装的组件

组件引擎（`packages/engine`）落地之后，从最简单的开始：

1. `sill.clock`、`sill.system` 这类只读卡先出声明式 `.sill`；
2. `sill.hero` 等 `image.bind` 与条件图标；
3. `sill.media`、`sill.todo` 走脚本沙箱，或等 v1.1 的 IR 状态模型。

在这之前，新增内置组件的流程仍然是改 Sill 的 `registry.tsx`，不是往这个目录放包。
