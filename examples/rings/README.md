# com.example.rings

三个圆环显示 CPU / 内存 / GPU，纯模板实现，没有 JS。

这个例子的作用是把「模板能做什么」钉死：

- `<svg>` / `<circle>` 可以直接写，宿主不再过滤标签；
- `pathLength="100"` 把圆周长归一化，`data-sill-meter` 写入的 `--sill-value` 直接当
  `stroke-dashoffset` 用；
- 宿主只改 CSS 变量、不重建节点，所以 `stroke-dashoffset` 的过渡能跨采样继续。

## 数据与权限

| 数据 | provider | 权限 |
|---|---|---|
| CPU | `system.cpu` | `data.system` |
| 内存 | `system.memory` | `data.system` |
| GPU | `system.gpu` | `data.system` |

GPU 读不到时 `gpu.usage` 为 `null`：`--sill-value` 不设置，环是空的，数字显示 `—`。

## 尺寸

建议 240 × 168。单跨在 185px 内容宽下三个环各约 50px，数字仍可读。

## 安装

```powershell
sill pack . -o rings.sill
```

设置 → 行为 → 组件 → 安装组件。

## 这个例子依赖的宿主版本

`runtime >=0.6.0`：这一版才去掉模板白名单并改成增量更新。旧宿主会按 `runtime` 拒绝加载。
