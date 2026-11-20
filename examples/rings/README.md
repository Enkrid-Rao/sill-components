# Rings

一张卡里的四个独立圆环：CPU、GPU、RAM、SWAP（虚拟内存）。

- 每环用 `data-sill-meter` 驱动，`pathLength="100"` 让读数直接当 dash 长度；
- 渐变、圆角、发光和呼吸光晕都在 CSS 里；
- 读不到 GPU / SWAP 时隐藏百分比与圆环，不显示 `—%`；
- SWAP 来自宿主 `system.swap` provider（Windows 虚拟内存 / commit）。

```powershell
sill pack . -o rings-1.2.0.sill
```

