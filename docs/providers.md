# 数据 provider

组件不直接读系统，也不自己开进程。宿主把数据采样成快照，按 manifest 的声明交给组件。
这份文件定义每个 provider 的字段、单位和权限；字段名就是 IR 绑定里的名字。

## 绑定名从哪来

`widget.json` 的 `data` 把 provider 映射成一个短名：

```json
"data": [
  { "id": "cpu", "source": "system.cpu" },
  { "id": "now", "source": "time.now" }
]
```

IR 里只使用短名：

```json
{ "type": "text", "bind": "now.time" },
{ "type": "bar", "bind": "cpu.usage" }
```

- 短名在组件内唯一，`[A-Za-z_][A-Za-z0-9_]*`。
- 未声明的短名不可访问，校验会失败。
- 同一个 provider 可以被两个短名引用，宿主负责去重与缓存。
- `bind` 的根只能是 `data[].id`、`settings`，以及列表模板里的 `item`。

不要写 `system.cpu.usage`——`system.cpu` 是 provider 名，不是绑定名。

## 时间

`time.now` · 权限 `data.time` · 每秒由宿主推进

| 字段 | 类型 | 说明 |
|---|---|---|
| `iso` | string | ISO 8601，带本地时区偏移，如 `2026-11-16T21:07:46+08:00` |
| `epoch` | number | Unix 秒 |
| `tz` | string | IANA 时区，如 `Asia/Shanghai` |
| `time` | string | `HH:mm`，24 小时制 |
| `date` | string | `YYYY-MM-DD` |
| `dateLabel` | string | 已本地化的日期，如 `11月16日 周日` |
| `weekday` | number | 0–6，周一为 0 |
| `hour` | number | 0–23 |
| `minute` | number | 0–59 |

`dateLabel` 会随 `language` 重新采样；切语言时组件不需要自己格式化日期。
需要自定义格式时用 `format(now.iso, "…")`，不要对 `now.time` 再格式化一次。

## 系统

全部需要 `data.system`。刷新间隔由设置里的监测频率决定（1 / 2 / 3 / 5 秒），宿主推送。

### `system.cpu`

| 字段 | 类型 | 说明 |
|---|---|---|
| `usage` | number | 0–100 |
| `cores` | number | 逻辑核心数 |

### `system.memory`

| 字段 | 类型 | 说明 |
|---|---|---|
| `percent` | number | 0–100 |
| `usedGb` | number | GB，保留一位小数由组件决定 |
| `totalGb` | number | GB |

### `system.gpu`

| 字段 | 类型 | 说明 |
|---|---|---|
| `usage` | number \| null | 0–100；没有独显或读不到时为 null |
| `memMb` | number \| null | 显存已用 MiB |
| `totalMb` | number \| null | 显存总量 MiB |

### `system.network`

| 字段 | 类型 | 说明 |
|---|---|---|
| `downBps` | number | 下行 bytes/s |
| `upBps` | number | 上行 bytes/s |

### `system.processes`

| 字段 | 类型 | 说明 |
|---|---|---|
| `topRam` | array | `{ name: string, mb: number }`，按内存降序 |
| `gpuMemMb` | number \| null | 显存已用 MiB |
| `gpuTotalMb` | number \| null | 显存总量 MiB |

不提供进程路径、命令行、PID、用户。这是 `data.system` 的硬边界。

## 媒体

`media.nowPlaying` · 权限 `data.media` · 每秒

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 曲名 / 视频标题 |
| `artist` | string | 艺术家，可能为空 |
| `album` | string | 专辑，可能为空 |
| `status` | string | `Playing` / `Paused` / `Stopped` / `Closed` |
| `position` | number | 秒 |
| `duration` | number | 秒，可能为 0（直播 / 未知） |
| `progress` | number | 0–100，由宿主算好，避免每个组件重复除 |
| `app` | string | 来源应用名 |

没有会话时整个 provider 为 `null`，不是空对象。

## 天气

`weather.current` · 权限 `data.weather` · 15 分钟，或切换城市时立即刷新

| 字段 | 类型 | 说明 |
|---|---|---|
| `temp` | number \| null | 当前温度，摄氏度 |
| `high` | number \| null | 当日最高 |
| `low` | number \| null | 当日最低 |
| `code` | number | WMO weather code |
| `cityId` | string \| null | 设置里选的城市 id；自动定位时可能为 null |
| `cityName` | string | provider 给的名称；组件可用 `cityId` 查本地化表 |
| `auto` | boolean | 是否自动定位 |
| `updatedAt` | number | 采样时间，ms epoch |
| `stale` | boolean | 数据超过刷新周期，仍是上一次成功值 |
| `error` | boolean | 最近一次请求失败 |

没有数据时整个 provider 为 `null`。失败但以前成功过时，provider 保留旧值并把 `stale` 置真。

## 待办

`todo.list` · 权限 `data.todo` · 变更时推送

数组，每项：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 稳定 id，撤销 / 编辑用 |
| `text` | string | 文本 |
| `done` | boolean | 是否完成 |

顺序就是插入顺序；已完成项不重新排序。

## 文件

`data.files` 不在 v1。文件选择器、路径与读取边界还没有设计好；把真实路径交给第三方脚本
风险太高，宁可不发这个权限。等有了 opaque handle + 宿主代读再评估。

## 宿主快照的对应关系

Sill 0.5.1 的 `PanelSnapshot` 是扁平的：

```ts
{ cpu, cores, memPct, memUsed, memTotal, down, up, gpu, gpuMem, gpuTotal,
  procs, media, weather, volume, muted, at }
```

provider 层是它的公开版本，字段名不同：

| 0.5.1 字段 | provider |
|---|---|
| `cpu` | `system.cpu.usage` |
| `cores` | `system.cpu.cores` |
| `memPct` / `memUsed` / `memTotal` | `system.memory.percent` / `usedGb` / `totalGb` |
| `gpu` / `gpuMem` / `gpuTotal` | `system.gpu.usage` / `memMb` / `totalMb` |
| `down` / `up` | `system.network.downBps` / `upBps` |
| `procs` | `system.processes.topRam` |
| `media` | `media.nowPlaying` |
| `weather` | `weather.current` |
| `volume` / `muted` | 不开放给 v1 组件（属于系统音量，媒体卡用命令读写） |

这张表是迁移用的，不应该出现在组件代码里。组件只认 provider，不认宿主快照。

## 刷新与订阅

- 声明式组件：宿主在 provider 变化时自动重新求值；组件不订阅。
- 脚本组件：`ctx.onUpdate(payload)` 会带 `changed: string[]`（发生变化的短名），按需拉取。
- 不允许组件自己 `setInterval` 轮询 provider；>10 Hz 的轮询直接拒绝。
- provider 没有变化时，宿主不触发重绘。

## 版本

- 字段只增不改；删除或改类型必须升 `engine` 的主版本。
- 新 provider 先出现在 `spec/providers.json` 与这份文档，再进引擎。
- 组件不应假设 provider 一定有值；`null` 是正常状态，不是错误。
