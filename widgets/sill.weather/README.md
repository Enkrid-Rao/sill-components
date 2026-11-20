# Weather

当前天气卡：城市名、天气图标、温度、天气描述和当天最高 / 最低温。

- provider：`weather.current`
- 权限：`data.weather`
- 默认尺寸：384 × 150，跨 1 列
- 无卡片标题；图标和温度随卡片宽度缩放
- 天气失败时沿用宿主上一次成功的数据（`stale`）

```powershell
sill pack ./sill.weather -o sill.weather-1.0.0.sill
```
