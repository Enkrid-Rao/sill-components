# 官方组件目录

这里是 Sill 的官方组件目录。主要包括：

- 有哪些组件。
- 每个组件用什么数据、长什么样、源码在哪。

目录和规范暂时放在同一个仓库里。等出现第三方组件、需要下载与更新服务时，再把索引拆出去；
在此之前，两份东西放一起更容易保持一致。

## 现在有什么

六个内置组件；前五个随 Sill 0.5.4 发布，`sill.shelf` 在开发分支：

| id | 名称 | 数据 | 跨列 | 文档 |
|---|---|---|---|---|
| `sill.hero` | 头图 | 时间、天气 | 整行 | [sill.hero](../widgets/sill.hero/README.md) |
| `sill.system` | 系统 | CPU / 内存 / GPU / 网络 | 1 | [sill.system](../widgets/sill.system/README.md) |
| `sill.processes` | 进程 | 进程内存、显存 | 1 | [sill.processes](../widgets/sill.processes/README.md) |
| `sill.media` | 媒体 | SMTC、系统音量 | 1 | [sill.media](../widgets/sill.media/README.md) |
| `sill.shelf` | 收纳 | 快捷方式 | 1 | [sill.shelf](../widgets/sill.shelf/README.md) |
| `sill.todo` | 待办 | 本地待办 | 1 或整行 | [sill.todo](../widgets/sill.todo/README.md) |

它们目前是**宿主内置实现**，不是 `.sill` 包：`installable` 全是 `false`。
内置组件已经能在面板里工作；它们没有独立安装包，所以不能从目录下载。

**为什么没有把它们的源码复制进来：** 这六个组件和宿主的 CSS、React context、布局 id
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
  "runtime": ">=0.5.4",
  "permissions": ["data.system"],
  "span": 1,
  "installable": false,
  "source": { "repo": "...", "path": "...", "ref": "v0.5.4" },
  "docs": "widgets/sill.system/README.md"
}
```

可安装的条目要多一个 `download`：指向 `.sill` 的 **https** 直链，并把 `installable` 设为 `true`。
Sill 的「设置 → 组件 → 组件目录」会读它，用户点安装后走和本地 `.sill` 相同的下载、能力档位提示与
`trust.json` 记忆流程。

```json
{
  "id": "com.you.clock",
  "version": "1.0.0",
  "type": "template",
  "status": "community",
  "installable": true,
  "download": "https://github.com/you/sill-clock/releases/download/v1.0.0/clock-1.0.0.sill"
}
```

`download` 必须是 https；Sill 只下载 `.sill`（zip），上限 50 MB，下载后按包内容重新校验，
不信任目录里的字段。目录本身也可以用 `SILL_CATALOG_URL` 指向自建索引（仅开发/镜像用）。
目录里的 `version` 也是更新来源：比本地新时，Sill 的「组件更新」会列出 `vA → vB`。

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
- `runtime` 是宿主版本范围；`engine` 是模板引擎版本范围。两个都满足才允许加载。
- 目录顶部的 `updated` 是索引变更日期，不是组件发布日期。
- 内置组件的 `source.ref` 指向 Sill 的发布标签；`ref` 不存在时，条目视为失效。

## 提交组件（目录下载开放之后）

本地 `.sill` 已经可以安装，但目录下载与自动更新还没完成，所以现在不接受「只交一个 `.sill`」的提交。
等 `sill pack` 和目录下载落地后，流程是：

1. 仓库根目录提供 `widget.json`、`ui/index.html`、`ui/style.css`、`README.md`；
   `.sill` 只打前三个，`README.md` 留在源码仓库；
2. `python scripts/validate.py` 与 `docs/testing.md` 全过；
3. 在 `registry/catalog.json` 增加条目，`docs` 指向仓库内的说明页；
4. PR 里说明数据来源、权限用途和失败时的表现。

硬规则：**模板不执行 JS、不联网、不写数据；数据只来自 manifest 声明的 provider。**

## 相关

- [规范首页](../README.md)
- [manifest](../docs/manifest.md) · [authoring](../docs/authoring.md) · [runtime](../docs/runtime.md)
- [package](../docs/package.md) · [安全模型](../docs/security.md) · [验收清单](../docs/testing.md) · [路线图](../docs/roadmap.md)

