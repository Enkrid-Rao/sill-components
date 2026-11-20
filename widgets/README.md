# 组件

这里放官方组件的说明页；可安装组件的源码也在本目录，索引数据在
[`registry/catalog.json`](../registry/catalog.json)。

| id | 说明 | 类型 | 可安装 |
|---|---|---|---|
| [sill.hero](sill.hero/README.md) | 日期、时钟、天气 | builtin | 否 |
| [sill.system](sill.system/README.md) | CPU / 内存 / GPU / 网络 | builtin | 否 |
| [sill.processes](sill.processes/README.md) | TOP RAM 与显存 | builtin | 否 |
| [sill.media](sill.media/README.md) | 正在播放与音量 | builtin | 否 |
| [sill.shelf](sill.shelf/README.md) | 快捷方式收纳 | builtin | 否 |
| [sill.todo](sill.todo/README.md) | 本地待办 | builtin | 否 |
| [sill.lyrics](sill.lyrics/README.md) | 同步歌词 | template | **是** |
| [sill.clock](sill.clock/README.md) | 时间 | template | **是** |
| [sill.calendar](sill.calendar/README.md) | 月历 | template | **是** |
| [sill.weather](sill.weather/README.md) | 当前天气 | template | **是** |
| [sill.rings](sill.rings/README.md) | CPU / GPU / RAM / SWAP 四圆环 | template | **是** |

## 内置与可安装

- `sill.hero` / `sill.media` / `sill.shelf` / `sill.todo` 仍是宿主内置实现，随应用发布，
  `installable: false` 是准确的；
- `sill.system` / `sill.processes` 仍是模板包，随应用发布在 `resources/builtin-widgets/`，
  不走目录下载，所以目录里仍是 `installable: false`；
- `sill.lyrics` / `sill.clock` / `sill.calendar` / `sill.weather` / `sill.rings` 是可安装的官方模板：
  源码在这个目录，打包产物在 [`registry/packages/`](../registry/packages/)，目录条目
  `installable: true` + `download` 指向本仓库的 raw 直链。

## 初始组件与官方组件

- **初始组件**（随应用发布）：hero、system、processes、media、shelf、todo；
- **官方可安装组件**（在本仓库发布）：lyrics、clock、calendar、weather、rings；
- 应用源码只保留初始组件；新组件不再进 `apps/desktop/resources/builtin-widgets/`。

## 发布一个可安装的官方组件

1. 在 `widgets/<id>/` 写 `widget.json` + `ui/**`（可选 `README.md`）；
2. `python scripts/validate.py widgets/<id>`；
3. `sill pack widgets/<id> -o registry/packages/<id>-<version>.sill`；
4. 在 `registry/catalog.json` 增加条目：`type: "template"`、`installable: true`、
   `download` 指向 `https://raw.githubusercontent.com/Enkrid-Rao/sill-components/main/registry/packages/...`、
   `docs` 指回 `widgets/<id>/README.md`；
5. `python scripts/validate.py` —— 会校验 manifest、模板、目录条目，并检查 `download` 文件确实存在。

发布新版本时升 `version`、重新 pack，并把 `download` 指向新文件名（旧包保留还是删除都可以）。
