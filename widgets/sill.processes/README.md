# sill.processes

内存占用最高的两个进程，加上显存占用。

## 显示什么

- `TOP RAM`：按内存排序的前两个进程，名称 + GB。
- 右上角是 `MEMORY` 标签，当前实现没有跟着显示总量。
- `TOP GPU`：一行标题，右侧是显存 `已用 / 总量`。

## 数据与权限

| 数据 | provider | 权限 |
|---|---|---|
| 进程与显存 | `system.processes` | `data.system` |

只暴露进程名和内存占用，不暴露路径、命令行、PID 或用户。这是 `data.system` 的边界，
不是这一张卡自己决定的。

## 尺寸与跨列

- 建议尺寸：384 × 144。
- 跨列：1。
- 两行进程名会截断，不换行；185px 宽下仍然保持一行。

## 交互

没有点击行为。

## 空态与错误

- 快照未到：两行显示 `—`。
- 进程列表为空：显示一条 `—`，不显示标题下的空白。
- 显存不可用：`—`。

## 已知问题

标题写的是 `TOP GPU`，但当前实现只显示显存占用，没有「按显存排序的进程」。
这是宿主采集侧还没有 GPU 进程数据，不是卡片的排版问题。补数据之前，这一行不应该被理解成
GPU 进程排行。

## 实现状态

**内置 React 实现，随 Sill 0.5.4 发布。** 源码：
[`ProcessesWidget.tsx`](https://github.com/Enkrid-Rao/sill/blob/v0.5.4/apps/desktop/src/renderer/src/widgets/ProcessesWidget.tsx)。

`installable: false`。

## 迁移到 `.sill`

模板 v1 没有循环，不能渲染进程列表；processes 仍是 React 内置组件。
等 `data-sill-repeat` 落地后再迁。

## 验收

- 两行进程名在 185px 下不换行、不重叠。
- 进程列表变化时行不跳动（名称长度变化由 `maxLines` 截断）。
- 无 GPU 时显存行显示 `—`，不显示 `0 / 0 GB`。
