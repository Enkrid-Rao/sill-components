# 组件

这里放每个组件的说明页。索引数据在 [`registry/catalog.json`](../registry/catalog.json)，
每个条目的 `docs` 指回本目录。

| id | 说明 | 类型 | 可安装 |
|---|---|---|---|
| [sill.hero](sill.hero/README.md) | 日期、时钟、天气 | builtin | 否 |
| [sill.system](sill.system/README.md) | CPU / 内存 / GPU / 网络 | builtin | 否 |
| [sill.processes](sill.processes/README.md) | TOP RAM 与显存 | builtin | 否 |
| [sill.media](sill.media/README.md) | 正在播放与音量 | builtin | 否 |
| [sill.shelf](sill.shelf/README.md) | 快捷方式收纳 | builtin | 否 |
| [sill.todo](sill.todo/README.md) | 本地待办 | builtin | 否 |

五个随 Sill 0.5.4 发布；`sill.shelf` 在开发分支，下一版发布。六个都还是宿主内置实现。`installable: false` 是准确的：
它们没有 `.sill` 包，也不应该被安装器当成可下载组件。

## 什么时候会有可安装的组件

本地 `.sill` 安装已经可用，目录下载还没做。从最简单的开始：

1. `sill.clock` 这类只读文本卡先出 `.sill`；
2. system / processes 可以开始用 `data-sill-if` / `data-sill-repeat` 做只读版；
3. media / todo 需要命令和状态，走后续的受限脚本路线，不塞进模板。

在这之前，新增内置组件的流程仍然是改 Sill 的 `registry.tsx`，不是往这个目录放包。
