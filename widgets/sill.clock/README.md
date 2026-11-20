# Clock · 时钟

一整张卡只做一件事：把「现在」说清楚。大号衬线时间、秒、日期与时段，底部一条
2px 的一天进度线——过了今天多少，不用读数字也看得出来。

- provider：`time.now`
- 权限：`data.time`
- 默认尺寸：384 × 132，跨 1 列
- 无卡片标题；字号随卡片宽度缩放

## 行为

- 时间来自 `time.now.iso`，24 小时制；秒数默认显示；
- 时段分五档：凌晨 / 清晨 / 上午 / 下午 / 晚上（英文 Late night / Early morning /
  Morning / Afternoon / Evening），由 `widget.json` 的 `strings` 提供，切语言即时跟随；
- 日期压成 `11月20日 周五` / `Fri 20 Nov`，比宿主的 `dateLabel` 短，窄卡不会截断；
- 底部进度线是一天走过的百分比，每秒平滑推进；`prefers-reduced-motion` 时不动画；
- 数据没到时显示 `--:--`，不抛错。

## 设置

| key | 类型 | 默认 | 说明 |
|---|---|---|---|
| `seconds` | switch | 开 | 显示秒数 |
| `hour12` | switch | 关 | 12 小时制；`PM` 作为上标贴在数字右上角 |
| `date` | switch | 开 | 显示日期 |

## 布局

- 窄卡（< 460px 内容宽）：时间一行，日期与时段一行，进度线贴底；
- 宽卡（≥ 460px）：时间与「日期 + 时段」左右分栏，时段升为衬线斜体，进度线横跨整卡；
- 最窄 120px 的自由卡也不横向溢出（日期会省略，时段、秒数保留）。

## 设计说明

时间用 `--serif` 斜体 + `tabular-nums`，与 Sill 头图卡的时钟同一个语气；秒、日期、
时段只用 `--ink-*` 与 `--accent`，没有写死颜色。宽卡不做拉伸，而是换一种排版。

```powershell
sill pack ./sill.clock -o sill.clock-1.1.0.sill
```
