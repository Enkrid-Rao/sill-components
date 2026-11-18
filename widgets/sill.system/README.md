# sill.system

CPU、内存、GPU、网络四根条。读数表示当前负载，不是仪表盘。

## 显示什么

- 标题行：`SYSTEM` + 核心数。
- CPU：百分比。
- 内存：百分比 + 已用 GB。
- GPU：百分比；没有独显时显示 `—`。
- 网络：下行速率；条的长度按 `MB/s` 缩放（1 MB/s ≈ 20%，封顶 100%）。

## 数据与权限

| 数据 | provider | 权限 |
|---|---|---|
| CPU | `system.cpu` | `data.system` |
| 内存 | `system.memory` | `data.system` |
| GPU | `system.gpu` | `data.system` |
| 网络 | `system.network` | `data.system` |

采样间隔由设置里的「监测频率」决定：1 / 2 / 3 / 5 秒。宿主主动推送快照，组件不轮询。

## 尺寸与跨列

- 建议尺寸：384 × 196。
- 跨列：1；三列时也可以手动拉到 2 或 3。
- 最窄内容宽约 185px。四根条在 185px 下仍然可读，但标签会收紧；这是这个卡的下限。

## 交互

没有点击行为。读数在两次采样之间用 560ms 的 `easeOutCubic` 插值，避免跳变；
`prefers-reduced-motion: reduce` 下直接落值。

## 空态与错误

- 快照还没到：所有读数显示 `—`，条宽为 0。
- GPU 不可用：GPU 行显示 `—`，其余三行正常。
- 采集卡住：宿主有陈旧阈值（2 × 间隔，至少 4s），超过后显示 `—`，不无限展示旧值。

## 实现状态

**内置 React 实现，随 Sill 0.5.4 发布。** 源码：
[`SystemWidget.tsx`](https://github.com/Enkrid-Rao/sill/blob/v0.5.4/apps/desktop/src/renderer/src/widgets/SystemWidget.tsx)。

`installable: false`，等模板引擎。

## 迁移到 `.sill`

模板 v1 只有文本绑定，不能画进度条 / 环形图；system 仍是 React 内置组件。
等模板支持样式绑定或更多的展示节点后再迁。

## 验收

- 1 / 2 / 3 / 5 秒四档频率下读数都更新，且不闪烁。
- 125% / 150% DPI 下条宽与文字不重叠。
- GPU 为空时只影响 GPU 行。
- 中文下标签不换行；185px 宽下不横向溢出。
