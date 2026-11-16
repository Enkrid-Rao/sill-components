# Manifest (`widget.json`)

`widget.json` 是组件的唯一入口。宿主先校验它，再决定是否加载 `ui/`。
包根目录必须有这个文件，UTF-8，无 BOM。

## 完整示例

```json
{
  "schema": 1,
  "id": "sill.clock",
  "name": "Clock",
  "description": "A quiet clock for the rail.",
  "version": "1.0.0",
  "author": "raoxi",
  "license": "MIT",
  "homepage": "https://github.com/Enkrid-Rao/sill-components",
  "runtime": ">=0.5.1",
  "engine": ">=0.1.0",
  "type": "declarative",
  "size": { "w": 384, "h": 160, "minW": 240, "minH": 96 },
  "span": { "default": 1 },
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "ui": "ui/layout.json",
  "settings": [
    {
      "key": "hour12",
      "type": "boolean",
      "default": false,
      "label": { "en": "12-hour clock", "zh": "12 小时制" }
    }
  ],
  "locales": {
    "en": "locales/en.json",
    "zh": "locales/zh.json"
  }
}
```

## 字段

| 字段 | 必需 | 说明 |
|---|---|---|
| `schema` | 是 | 固定 `1` |
| `id` | 是 | 反向域名，全局唯一，至少两段 |
| `name` | 是 | 展示名，1–24 字 |
| `description` | 否 | 一句话，安装器与目录展示 |
| `version` | 是 | 组件版本，semver |
| `author` | 是 | 作者名或组织 |
| `license` | 是 | SPDX 标识；无许可证不能发布 |
| `homepage` | 否 | 组件主页 / 源码 |
| `runtime` | 是 | **宿主应用**版本范围 |
| `engine` | 是 | **组件引擎**版本范围 |
| `type` | 是 | `declarative` / `script` |
| `size` | 否 | 建议尺寸（逻辑 px），不影响宿主布局 |
| `span` | 否 | 默认跨列 |
| `permissions` | 是 | 能力白名单 |
| `data` | 否 | 绑定名 → provider |
| `ui` | 是 | 相对包根的入口路径 |
| `settings` | 否 | 组件设置 schema |
| `locales` | 否 | 语言 → 文案文件 |
| `assets` | 否 | 需要打包 / 暴露的资源列表 |
| `fonts` | 否 | 包内 woff2 字体声明 |
| `network` | 否 | 网络域名白名单；声明 `network` 权限时必需 |

## id

- 至少两段，反向域名：`sill.clock`、`com.example.weather`。
- 只允许小写字母、数字、`.`、`-`；每段不以 `-` 开头或结尾，不能有空段。
- 宿主按 `id` 去重；同一 `id` 的不同版本共享存储，安装目录分开。
- `sill` 单段不合法；`a..b`、`a-.b` 也不合法。

## version / runtime / engine

```json
"version": "1.0.0",
"runtime": ">=0.5.1",
"engine": ">=0.1.0"
```

- `version` 是组件自己的 semver，允许 prerelease 与 build metadata。
- `runtime` 是宿主应用范围；`engine` 是组件引擎范围。**两个都满足才加载。**
- 0.5.1 满足 `runtime`，但引擎还没发布，所以任何 `engine: ">=0.1.0"` 的组件现在都装不上。
  这是正确行为，不要为了「能装」把 `engine` 写成 `>=0.0.0`。
- 两个范围都是 semver range；不满足时拒绝加载，不降级。

## type

| 值 | `ui` 指向 | 说明 |
|---|---|---|
| `declarative` | `layout.json` | 由 IR 引擎编译成 React 节点；v1 只读 |
| `script` | `main.js` | 在 sandbox iframe 内运行；有完整交互能力 |

声明式优先。只有 IR 表达不了的东西才用脚本。

## size 与 span

```json
"size": { "w": 384, "h": 160, "minW": 240, "minH": 96 },
"span": { "default": 1, "byColumns": { "2": 1, "3": 2 } }
```

- `size` 是目录展示与初始占位的建议值；宿主不会据此改窗口或重排卡片。
- `minW/minH` 是作者自测与目录展示用的建议值。v1 **不会**因为 `minW` 自动重排其他卡片；
  内容在窄卡下不可读时，用 `span.default` 争取更多列。
- `span.default` 是用户没手动设置时的默认跨列，1–3。
- `span.byColumns` 可按列数覆盖默认值；宿主会把它夹到当前列数（1 列时恒为 1）。
- 用户的 `layout.spans` 永远优先于 manifest。
- 不提供 `span` 时按 1 处理。

## permissions

权限在安装时展示，运行时由宿主强制。未声明的能力调用会失败。

| 权限 | 允许 |
|---|---|
| `data.time` | 读 `time.now` |
| `data.system` | 读 CPU / 内存 / GPU / 网络 / 进程快照 |
| `data.media` | 读当前媒体会话，并发送播放控制命令 |
| `data.weather` | 读天气快照 |
| `data.todo` | 读待办，并增删改 |
| `storage` | 组件自己的键值存储（有配额） |
| `network` | 通过宿主代理访问 `network.domains` 中的域名 |
| `commands` | 打开 URL、通知、收起面板、刷新数据 |
| `settings` | 读写本组件设置 |

- 权限不能动态申请；加权限必须改 manifest，由用户重新确认。
- `data.files` 不在 v1。文件选择器与路径边界还没设计好，不要预留。
- 声明 `network` 必须同时给 `network.domains`；给了域名也必须声明 `network` 权限，
  两者互相约束，schema 会检查。

## data

```json
"data": [
  { "id": "now", "source": "time.now" },
  { "id": "cpu", "source": "system.cpu" }
]
```

- `id` 是 IR / 脚本里使用的绑定名，`[A-Za-z_][A-Za-z0-9_]*`。
- `source` 是 [providers.md](providers.md) 里的 provider 名。
- 多个绑定可以指向同一 provider；宿主负责去重与缓存。
- 未在 `data` 声明的 provider 不可访问。
- 组件不能自己起进程、不能直接访问网络。

## network

```json
"permissions": ["network"],
"network": {
  "domains": ["api.example.com", "cdn.example.com"]
}
```

- 精确主机名，不支持通配符、协议、端口或路径。
- 只允许 HTTPS；HTTP 会被拒绝。
- 宿主按解析后的 IP 复查，拒绝私有地址、回环、链路本地与保留段。
- 每一跳重定向都重新检查域名与 IP。
- 单次响应上限 2 MB，超时 8 秒，每天 50 MB；超限拒绝。
- 不转发宿主 cookie；组件不能自定义 `Cookie` / `Authorization`。

## settings

设置 schema 由宿主渲染，组件不能自绘宿主设置页。

```json
{
  "key": "hour12",
  "type": "boolean",
  "default": false,
  "label": { "en": "12-hour clock", "zh": "12 小时制" }
}
```

| type | 额外字段 |
|---|---|
| `boolean` | `default` |
| `number` | `default`, `min`, `max`, `step` |
| `select` | `default`, `options: [{ value, label }]` |
| `string` | `default`, `maxLength` |

- `key` 在组件内唯一，`[A-Za-z_][A-Za-z0-9_]*`。
- `label` 必填，至少一种语言；缺失语言回退到 `en`。
- `number` 的 `default` 必须在 `min`/`max` 内；`min <= max`。
- `select` 的 `default` 必须在 `options[].value` 中。
- 设置只影响当前组件；宿主不会把组件设置混进全局设置。
- 变更通知：脚本用 `ctx.settings.onChange`，声明式用 `settings.<key>` 绑定。

## locales

```json
"locales": { "en": "locales/en.json", "zh": "locales/zh.json" }
```

文件是扁平 `key → string` JSON，不允许嵌套对象。示例：

```json
{
  "clock.greeting": "Good evening",
  "clock.today": "Today"
}
```

- key 只能用小写字母、数字、`.`、`_`、`-`。
- 只允许组件自己的命名空间；宿主文案不可覆盖。
- 缺失 key 回退顺序：当前语言 → `en` → key 本身（并在开发者面板警告）。
- `text.i18n` / `button.i18n` / `image.altI18n` 引用这些 key。

## assets 与 fonts

```json
"assets": ["assets/icon.svg", "assets/cover.jpg"],
"fonts": [
  { "family": "Sill Mono", "src": "assets/sill-mono.woff2", "weight": 400 }
]
```

- 只列出的资源会进入 `.sill` 包；未列出的文件不安装。
- 单文件 ≤ 2 MB，总资源 ≤ 10 MB，文件数 ≤ 200。
- 字体只允许包内 `.woff2`；系统字体不需要声明。`fonts[].src` 必须同时出现在 `assets` 中。
- 图片路径以 `assets/` 开头；远程图片必须走 `network` 白名单，且要声明对应域名。
- 图标按钮的 `icon` 也必须是包内资源。

## 校验规则

`validate` 至少检查：

1. 根目录存在 `widget.json`，UTF-8，无 BOM，可解析。
2. `schema` 精确等于 `1`。
3. `id` 至少两段、格式合法；全局唯一。
4. `version` 是合法 semver；`runtime` / `engine` 是合法 range。
5. `type` 与 `ui` 扩展名匹配（`.json` / `.js`）。
6. `ui`、`locales`、`assets`、`fonts[].src` 都是包内相对路径，不逃出包根，
   不含反斜杠、盘符、UNC、`..`、绝对路径或符号链接。
7. `ui`、`locales`、`assets`、`fonts[].src` 指向的文件真实存在。
8. `permissions` 覆盖 `data[].source` 与 IR / 脚本实际用到的命令。
9. `network` 与 `network` 权限同时出现；域名合法且不是 IP 字面量。
10. `settings[].key` 不重复；`default` 类型匹配；`number` 的范围与 `select` 的选项包含默认值。
11. `locales` 文件是扁平字符串表；引用的 key 在 `en` 中存在。
12. IR 节点 / 属性在白名单内；绑定表达式符合语法；`image.src` 的资源已声明。
13. 包大小、文件数、单文件大小在上限内；解压后不超安全上限。

失败时安装器不写入任何文件。`validate` 的错误应带 `文件:路径` 与错误码，便于编辑器与 CI 消费。

## 安装路径与配额

路径相对于宿主的 `userData`，不要写死 `%APPDATA%`——便携版会把它指到 exe 旁的 `Sill-data`。

| 内容 | 路径 | 配额 |
|---|---|---|
| 组件包 | `<userData>/components/<id>@<version>/` | 10 MB / 200 文件 |
| 组件存储 | `<userData>/widget-data/<id>/` | 5 MB / 200 key / 单值 256 KB |
| 组件设置 | 宿主设置文件内的 `widgets.<id>` | 与设置文件同配额 |
| 目录索引缓存 | `<userData>/catalog/` | 由宿主管理 |

- 升级保留存储与设置；卸载删除组件目录与 `widget-data/<id>/`，不动用户待办、全局设置与布局。
- 安装使用临时目录 + 原子 rename；失败不留下半个包。
- 组件目录名由 `id@version` 生成，不信任压缩包内目录名。

## 版本

- 破坏性 manifest 变更必须升 `schema`，并提供迁移器。
- 新增可选字段不升 `schema`，但必须提高 `engine` 的最低版本；旧宿主会在 validate 阶段拒绝
  未知字段，安装器应提示「需要更新 Sill」，而不是静默忽略。
- 组件版本遵循 semver；宿主只按 `id` 识别组件，不按路径。
