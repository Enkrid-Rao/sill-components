# Clock

最小模板组件：时间 + 日期，不写 JS，不画卡片背景。

```text
clock/
├─ widget.json
└─ ui/
   ├─ index.html
   └─ style.css
```

## 它演示什么

- manifest 的最小字段：`id`、`runtime`、`engine`、`type: "template"`、`permissions`、`data`、`ui`；
- 数据绑定：`data[].id = "now"` → `data-sill-text="now.time"`；
- 玻璃和 atmosphere 由 `WidgetShell` 的 `.card` 提供，模板只画内容；
- 主题通过 CSS 变量继承（`--ink`、`--serif`）。

## 现在能做什么

Sill 开发分支可以本地安装 `.sill`：

1. 在 `clock/` 里把 `widget.json` 和 `ui/` 压成 zip；
2. 把扩展名改成 `.sill`；
3. 设置 → 行为 → 组件 → 安装组件…。

也可以继续用开发模式：

```powershell
$env:SILL_DEV_WIDGET = 'D:\Projects\Sill-Components\examples\clock'
pnpm dev
```

（路径指向 Sill 仓库的启动目录。）正式目录下载和 `sill dev` 仍在 roadmap 上。

## 尺寸

- 建议 384 × 160，单跨。
- 最窄要能在 185px 下放下；日期用单行截断。
- 中文 caption 由宿主 token 保证 ≥10.5px。

## 验收

- 320 / 384 / 714 / 1180 面板宽下不横向溢出。
- 时间每分钟更新，日期跨天更新。
- 没有数据时显示 `—`，不抛错。
- 主题切换时文字颜色跟随宿主。
