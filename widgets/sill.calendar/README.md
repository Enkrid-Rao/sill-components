# Calendar

月历卡：月份 + 年份、周标题、日期网格，今天用强调色圈出。中文周一开头，英文周日开头。

- provider：`time.now`
- 权限：`data.time`
- 默认尺寸：384 × 232，跨 1 列
- 无卡片标题；格子高度和字号随卡片宽度缩放

```powershell
sill pack ./sill.calendar -o sill.calendar-1.0.0.sill
```
