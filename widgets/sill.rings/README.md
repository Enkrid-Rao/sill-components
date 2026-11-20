# Rings

一张卡里的四个独立圆环：CPU、GPU、RAM、SWAP（虚拟内存 / commit）。

- provider：`system.cpu` / `system.gpu` / `system.memory` / `system.swap`
- 权限：`data.system`
- 默认尺寸：260 × 252，跨 2 列
- 宽卡自动排成一行四个，窄卡 2×2；圆环直径按卡片宽度计算
- SWAP 中心显示百分比，下面显示 `已用 / 总量 GB`
- 读不到 GPU / SWAP 时沿用上一次有效值，不把环打回 0

```powershell
sill pack ./sill.rings -o sill.rings-1.0.0.sill
```
