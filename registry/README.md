# 官方组件目录

这里是 Sill 的官方组件目录。它回答两个问题：**有哪些组件**，以及**每个组件要什么权限、长什么样、源码在哪**。

目录和规范暂时放在同一个仓库里。等出现第三方组件、需要下载与更新服务时，再把索引拆出去；
在此之前，两份东西放一起更容易保持一致。

## 现在有什么

五个内置组件，全部随 Sill 0.5.1 一起发布：

| id | 名称 | 数据 | 跨列 | 文档 |
|---|---|---|---|---|
| `sill.hero` | 头图 | 时间、天气 | 整行 | [sill.hero](../widgets/sill.hero/README.md) |
| `sill.system` | 系统 | CPU / 内存 / GPU / 网络 | 1 | [sill.system](../widgets/sill.system/README.md) |
| `sill.processes` | 进程 | 进程内存、显存 | 1 | [sill.processes](../widgets/sill.processes/README.md) |
| `sill.media` | 媒体 | SMTC、系统音量 | 1 | [sill.media](../widgets/sill.media/README.md) |
| `sill.todo` | 待办 | 本地待办 | 1 或整行 | [sill.todo](../widgets/sill.todo/README.md) |

它们目前是**宿主内置实现**，不是 `.sill` 包：`installable` 全是 `false`。
这不是占位——内置组件已经能在面板里工作，只是还没有被搬到组件引擎上。
引擎落地后，这份目录会按下面的顺序迁移：

1. 能纯声明式表达的（system、processes）先出 `.sill` 包；
2. hero 需要条件图标，等 `image.bind + map` 落地；
3. media、todo 依赖本地状态与逐行动作，走脚本组件或 v1.1 的 IR 状态模型。

**为什么没有把它们的源码复制进来：** 这五个组件和宿主的 CSS、React context、`CardId`
绑在一起，复制一份到本仓库会立刻漂移，而且没有宿主依赖也编译不了。目录只记录来源、权限与
契约；等它们变成真正独立的 `.sill` 包，再逐个搬进来。

## `catalog.json`

[`catalog.json`](catalog.json) 是给安装器与目录页读的索引，不是组件包本身。
每个条目对应一个组件，字段含义与 `widget.json` 对齐，另外多出 `status`、`source`、`docs`：

```json
{
  "id": "sill.system",
  "name": { "en": "System", "zh": "系统" },
  "summary": { "en": "...", "zh": "..." },
  "version": "1.0.0",
  "type": "builtin",
  "status": "builtin",
  "engine": ">=0.1.0",
  "runtime": ">=0.5.1",
  "permissions": ["data.system"],
  "span": 1,
  "installable": false,
  "source": { "repo": "...", "path": "...", "ref": "v0.5.1" },
  "docs": "widgets/sill.system/README.md"
}
```

字段定义见 [`spec/catalog.schema.json`](../spec/catalog.schema.json)。`python scripts/validate.py`
会检查索引、文档路径、id 唯一性和权限枚举。

## 状态

| `status` | 含义 | 谁能进 |
|---|---|---|
| `builtin` | 随 Sill 发布的内置组件 | 维护者 |
| `verified` | 第三方提交，按 `docs/testing.md` 验过 | 维护者审核后 |
| `community` | 第三方提交，只做了 manifest 与安全检查 | 暂不开放 |

`verified` 只代表「按这份规范检查过」，不代表代码签名，也不代表作者可信。
安装时仍然要展示权限、来源与大小，由用户确认。

## 版本与兼容

- 每个条目有自己的 `version`（组件版本），与 Sill 的版本无关。
- `runtime` 是宿主版本范围；`engine` 是组件引擎版本范围。两个都满足才允许加载。
- 目录顶部的 `updated` 是索引变更日期，不是组件发布日期。
- 内置组件的 `source.ref` 指向 Sill 的发布标签；`ref` 不存在时，条目视为失效。

## 提交组件（安装器落地之后）

现在还没有下载与安装通道，所以不接受「只交一个 `.sill`」的提交。等 `sill pack` 与安装器落地后，
流程是：

1. 仓库根目录提供 `widget.json`、`ui/`、`README.md` 和 `preview`（可选）；
2. `python scripts/validate.py` 与 `docs/testing.md` 全过；
3. 在 `registry/catalog.json` 增加条目，`docs` 指向仓库内的说明页；
4. PR 里说明数据来源、权限用途和失败时的表现。

第一条硬规则：**没有声明 `network` 域名的组件不能访问网络；没有 `data.*` 权限的组件不能读数据。**
第二条：内置组件能做到的事，第三方组件也必须能做到——做不到就是引擎缺能力，不是组件该绕过去。

## 相关

- [规范首页](../README.md)
- [manifest](../docs/manifest.md) · [IR](../docs/ir.md) · [runtime](../docs/runtime.md) · [脚本](../docs/scripts.md)
- [安全模型](../docs/security.md) · [验收清单](../docs/testing.md) · [路线图](../docs/roadmap.md)
