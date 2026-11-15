# Manifest (`widget.json`)

`widget.json` 是组件的唯一入口。宿主先校验它，再决定是否加载 `ui/`。

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
  "runtime": ">=0.5.0",
  "type": "declarative",
  "size": {
    "w": 384,
    "h": 180,
    "minW": 300,
    "minH": 96
  },
  "permissions": ["data.time", "storage"],
  "data": [
    { "id": "now", "source": "time.now" }
  ],
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
| `id` | 是 | 反向域名，全局唯一，`[a-z0-9.-]`，至少两段 |
| `name` | 是 | 展示名，建议 1–24 字 |
| `description` | 否 | 一句话，安装器展示 |
| `version` | 是 | 组件版本，semver |
| `author` | 是 | 作者名或组织 |
| `license` | 是 | SPDX 标识；无许可证不能发布 |
| `homepage` | 否 | 组件主页 / 源码 |
| `runtime` | 是 | 宿主版本范围，semver range |
| `type` | 是 | `declarative` / `script` |
| `size` | 否 | 建议尺寸与最小尺寸（逻辑 px） |
| `permissions` | 是 | 能力白名单，见下 |
| `data` | 否 | 绑定名 → 数据 provider |
| `ui` | 是 | 相对包根的入口路径 |
| `settings` | 否 | 组件设置 schema |
| `locales` | 否 | 语言 → 文案文件 |
| `assets` | 否 | 需要打包/暴露的资源列表 |

### id

- 反向域名：`sill.clock`、`com.example.weather`。
- 只允许小写字母、数字、`.`、`-`，不以 `.`/`-` 开头或结尾。
- 宿主按 `id` 去重；不同版本不能共享 `id` 目录。

### runtime

- semver range，例如 `>=0.5.0 <1.0.0`。
- 宿主不满足时**拒绝加载**，不尝试降级运行。
- 组件的 `schema` 与宿主引擎版本是两条独立兼容线。

### type

| 值 | 入口 | 说明 |
|---|---|---|
| `declarative` | `ui` 指向 `layout.json` | 由 IR 引擎编译 |
| `script` | `ui` 指向 `main.js` | 在 sandbox iframe 运行 |

### size

```json
{ "w": 384, "h": 180, "minW": 300, "minH": 96 }
```

- `w/h` 是侧边廊里的**建议占位**，不是绝对尺寸；卡片高度由内容与流决定。
- `minW/minH` 约束组件自身的最小可读尺寸；宿主会把可用宽度夹到面板列宽。
- 不提供 size 时按 `w=384, h=160, minW=280, minH=80` 处理。
- 组件必须在 320–1180 的连续宽度下工作，不能假设固定宽度。

### permissions

权限在安装时展示，运行时由宿主强制。未声明的能力调用会失败。

| 权限 | 允许 |
|---|---|
| `data.time` | 读取时间 provider |
| `data.system` | 读取 CPU / 内存 / GPU / 网络 / 进程快照 |
| `data.media` | 读取当前媒体会话（标题、艺术家、进度） |
| `data.weather` | 读取天气（自动/手动地区） |
| `data.todo` | 读取并修改待办 |
| `data.files` | 读取用户明确选择的文件 |
| `storage` | 组件自己的键值存储（有配额） |
| `network` | 通过宿主代理访问白名单域名 |
| `commands` | 打开 URL、启动应用、通知、收起面板 |
| `settings` | 读写本组件设置 |

权限不能通过脚本动态申请；需要额外权限必须升级 manifest，由用户重新确认。

### data

```json
"data": [
  { "id": "now", "source": "time.now" },
  { "id": "cpu", "source": "system.cpu" }
]
```

- `id` 是 IR / 脚本里使用的绑定名。
- `source` 是宿主提供的 provider。
- 多个绑定可以指向同一 provider；宿主负责去重与缓存。
- 未在 `data` 声明的 provider 不可访问。

### settings

设置 schema 由宿主渲染，组件不能自绘宿主设置页。

```json
{
  "key": "hour12",
  "type": "boolean",
  "default": false,
  "label": { "en": "12-hour clock", "zh": "12 小时制" }
}
```

类型：

| type | 额外字段 |
|---|---|
| `boolean` | `default` |
| `number` | `default`, `min`, `max`, `step` |
| `select` | `default`, `options: [{ value, label }]` |
| `string` | `default`, `maxLength` |

- `key` 在组件内唯一。
- 设置只影响当前组件；宿主不会把组件设置混进全局设置。
- 设置变更通过 `ctx.settings.onChange` 通知（脚本）或 `settings` 绑定（IR）。

### locales

```json
"locales": { "en": "locales/en.json", "zh": "locales/zh.json" }
```

- 文件是扁平 `key → string` JSON。
- 只允许组件自己的命名空间；宿主会给缺失 key 回退到 `en`。
- 组件不能覆盖 Sill 的全局文案。

### assets

```json
"assets": ["assets/icon.svg", "assets/cover.jpg"]
```

- 只列出的资源会进入 `.sill` 包。
- 单文件 ≤ 2 MB，总资源 ≤ 10 MB（计划值）。
- 字体需要额外声明；默认只允许系统字体与包内 woff2。

## 校验规则

`validate` 至少检查：

1. 根目录存在 `widget.json`，UTF-8，无 BOM。
2. `schema` 精确等于 `1`。
3. `id` 唯一、格式合法、与目录名无关。
4. `version` 是合法 semver。
5. `runtime` 是合法 semver range。
6. `type` 与 `ui` 扩展名匹配。
7. `ui`、`locales`、`assets` 路径不得逃出包根（`..`、绝对路径、符号链接）。
8. 未声明的权限不能在 `data`/`ui` 中使用。
9. `settings[].key` 不重复；默认值类型匹配。
10. 所有 JSON 文件可解析；单文件大小在上限内。

失败时安装器不写入任何文件。
