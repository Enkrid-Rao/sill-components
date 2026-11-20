# Rings · 监控环

一张卡里的四个独立圆环：CPU、GPU、RAM、SWAP（虚拟内存 / commit）。
每个环下面都有一行「用了多少」：CPU 显示核数，其余显示 `已用 / 总量 GB`。

- provider：`system.cpu` / `system.gpu` / `system.memory` / `system.swap`
- 权限：`data.system`
- 默认尺寸：260 × 252，跨 2 列
- 宽卡一行四个，窄卡 2×2；圆环直径跟格子走，上限 112px，不会把卡撑成一整屏
- 读不到 GPU / SWAP 时环留空、显示「无数据」，不会伪造 `0%`

## 行为

- 弧长由 `data-sill-meter` 写入的 `--sill-value`（0–100）驱动，数字、单位、副标题和
  `aria-label` 由 `main.js` 格式化（整数百分比，不用宿主默认的一位小数）；
- 值为 0 或没有数据时弧线隐藏，不留下一个圆头小点；
- CPU 副标题是核数（读取 `strings.cores`，中英自动切换）；GPU 显存、RAM、SWAP 都按
  1024 MB = 1 GB 换算成一位小数；
- 悬浮时环的光晕略微增强，`prefers-reduced-motion` 下取消弧线动画。

## 颜色

四个环只用主题色，不写死色相：

| 环 | 颜色 | 说明 |
|---|---|---|
| CPU | `--accent` | 主强调色 + 光晕 |
| GPU | `--accent-2` | 强调色 +42° 的邻近色 |
| RAM | `--accent-pale` | 强调色的浅色档 |
| SWAP | `--ink-dim` | 虚拟内存是辅助信息，不抢色、没有光 |

切到 Ember / Aurora / Dusk 时四个环一起换色相，不会残留上一套薄荷 / 蓝 / 粉。

## 布局

- ≥ 300px 内容宽：一行四个；更窄：2×2；
- 很窄的自由卡（< 200px）：字号再收一档，仍不横向溢出；
- 圆环内部用容器查询取字号，环大时数字大、环小时数字小。

```powershell
sill pack ./sill.rings -o sill.rings-1.1.0.sill
```
