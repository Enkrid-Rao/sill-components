# Manifest (`widget.json`)

`widget.json` 是模板组件的唯一入口。宿主先校验它，再读取 `ui/`。
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
  "runtime": ">=0.5.4",
  "engine": ">=0.1.0",
  "type": "template",
  "size": { "w": 384, "h": 160, "minW": 240, "minH": 96 },
  "span": { "default": 1 },
  "permissions": ["data.time"],
  "data": [{ "id": "now", "source": "time.now" }],
  "strings": {
    "en": { "label": "LOCAL TIME" },
    "zh": { "label": "本地时间" }
  },
  "ui": "ui/index.html"
}
```

## 字段

| 字段 | 必需 | 说明 |
|---|---|---|
| `schema` | 是 | 固定 `1` |
| `id` | 是 | 反向域名，全局唯一，至少两段 |
| `name` | 是 | 展示名，1–24 字 |
| `description` | 否 | 简短描述，安装器与目录展示 |
| `version` | 是 | 组件版本，semver |
| `author` | 是 | 作者名或组织 |
| `license` | 是 | SPDX 标识；无许可证不能发布 |
| `homepage` | 否 | 组件主页 / 源码 |
| `runtime` | 是 | **宿主应用**版本范围 |
| `engine` | 是 | **模板引擎**版本范围 |
| `type` | 是 | 固定 `template` |
| `size` | 否 | 建议尺寸（逻辑 px），不影响宿主布局 |
| `span` | 否 | 默认跨列 |
| `permissions` | 是 | 只读数据权限 |
| `data` | 否 | 绑定名 → provider |
| `strings` | 否 | 内联本地化文本 |
| `ui` | 是 | HTML 模板的相对路径 |

v1 没有 `settings` / `locales` 文件 / `network`。本地化放 `strings`；web 组件可带 `ui/assets/**`，template 不执行 JS、不联网，
这些能力在后续版本单独设计。

## id

- 至少两段，反向域名：`sill.clock`、`com.example.weather`。
- 只允许小写字母、数字、`.`、`-`；每段不以 `-` 开头或结尾，不能有空段。
- 宿主按 `id` 去重；同一 `id` 的不同版本共享存储（未来），安装目录分开。
- `sill` 单段不合法；`a..b`、`a-.b` 也不合法。

## version / runtime / engine

```json
"version": "1.0.0",
"runtime": ">=0.5.4",
"engine": ">=0.1.0"
```

- `version` 是组件自己的 semver，允许 prerelease 与 build metadata。
- `runtime` 是宿主应用范围；`engine` 是模板引擎范围。**两个都满足才加载。**
- 0.5.4 正式版没有模板引擎；开发分支可以直接安装本地 `.sill`，也可以用
  `SILL_DEV_WIDGET` 预览文件夹。
- 两个范围都是 semver range；不满足时拒绝加载，不降级。

## type 与 trust

| 值 | 说明 |
|---|---|
| `template` | HTML/CSS，宿主渲染进 `.card` 的 Shadow DOM |
| `web` | HTML/CSS/JS，透明 webview guest |

web 的 `trust`：

| 值 | 能力 |
|---|---|
| `sandboxed`（默认） | `window.sill` 桥；无 Node / 文件 / 网络 |
| `trusted` | 完整 Node、`child_process`、native addon、Windows API |

- template 没有 `trust`，永远无 JS。
- trusted 安装时必须显示完全信任警告，不能进 sandboxed 市场。
- `declarative` / `script` 已移除。

## size 与 span

```json
"size": { "w": 384, "h": 160, "minW": 240, "minH": 96 },
"span": { "default": 1, "byColumns": { "2": 1, "3": 2 } }
```

- `size` 是目录展示与初始占位的建议值；宿主不会据此改窗口或重排卡片。
- `minW/minH` 是作者自测与目录展示用的建议值；v1 不会因为 `minW` 自动重排其他卡片。
- `span.default` 是用户没手动设置时的默认跨列，1–3。
- `span.byColumns` 可按列数覆盖；宿主会把它夹到当前列数（1 列时恒为 1）。
- 用户的 `layout.spans` 永远优先于 manifest。

## permissions

template 只能**只读**数据；权限在安装时展示，运行时由宿主强制。web 的 Node 能力由 `trust` 决定。

| 权限 | 允许 |
|---|---|
| `data.time` | 读 `time.now` |
| `data.system` | 读 CPU / 内存 / GPU / 网络 / 进程快照 |
| `data.media` | 读当前媒体会话 |
| `data.weather` | 读天气快照 |
| `data.todo` | 读待办列表 |
| `action.media` | 播放 / 暂停 / 上一首 / 下一首 / 静音 |
| `action.todo` | 切换待办完成状态 |

- 权限不能动态申请；加权限必须改 manifest，由用户重新确认。
- v1 没有 `storage` / `network` / `settings`；模板不能写、不能联网。

## data

```json
"data": [
  { "id": "now", "source": "time.now" },
  { "id": "cpu", "source": "system.cpu" }
]
```

- `id` 是模板里 `data-sill-text` 的根名，`[A-Za-z_][A-Za-z0-9_]*`。
- `source` 是 [providers.md](providers.md) 里的 provider 名。
- 多个绑定可以指向同一 provider；宿主负责去重与缓存。
- 未在 `data` 声明的 provider 不可访问。

## strings

```json
"strings": {
  "en": { "label": "LOCAL TIME" },
  "zh": { "label": "本地时间" }
}
```

- 模板用 `data-sill-i18n="label"` 取当前语言；
- 找不到当前语言时回退到 `en`，再回退到 key；
- v1 只允许内联对象，不打包 `locales/*.json`；
- 每个语言最多 100 个 key，单个值最多 160 字。

## ui

```json
"ui": "ui/index.html"
```

- 必须是包根下的相对路径，v1 固定 `ui/index.html`；
- 同目录必须有 `style.css`；
- 不接受 `..`、绝对路径、反斜杠、盘符、UNC；
- 模板不能带 `ui/*.js`。

## 校验规则

`validate` 至少检查：

1. 根目录存在 `widget.json`，UTF-8，无 BOM，可解析。
2. `schema` 精确等于 `1`。
3. `id` 至少两段、格式合法；全局唯一。
4. `version` 是合法 semver；`runtime` / `engine` 是合法 range。
5. `type` 精确等于 `template`；`ui` 固定为 `ui/index.html`。
6. `ui` 是包内相对路径，不逃出包根，不含反斜杠、盘符、UNC、`..`。
7. `ui` 指向的文件存在；同目录 `style.css` 存在。
8. `permissions` 覆盖 `data[].source` 所需的权限。
9. `data[].id` 不重复；`source` 是已知 provider。
10. `span.byColumns` 不超过对应列数。
11. 模板 HTML / CSS 通过白名单检查（见 [template.md](template.md)）。
12. 包大小、文件数在上限内。

失败时安装器不写入任何文件。`validate` 的错误应带 `文件:路径`，便于编辑器与 CI 消费。

## 安装路径与配额

路径相对于宿主的 `userData`，不要写死 `%APPDATA%`——便携版会把它指到 exe 旁的 `Sill-data`。
包结构、安装与卸载见 [package.md](package.md)。

| 内容 | 路径 | 配额 |
|---|---|---|
| 组件包 | `<userData>/components/<id>@<version>/` | 10 MB / 3 文件 / 单文件 512 KB |
| 组件存储 | 暂未开放 | — |
| 组件设置 | 暂未开放 | — |
| 目录索引缓存 | `<userData>/catalog/` | 由宿主管理 |

- 同一个 id 只允许一个版本；升级要先卸载再安装。
- 卸载删除组件目录，并把 id 从布局移除；不动用户待办、全局设置与主题。
- 安装使用临时目录 + 原子 rename；失败不留下半个包。
- 组件目录名由 `id@version` 生成，不信任压缩包内目录名。

## 版本

- 破坏性 manifest 变更必须升 `schema`，并提供迁移器。
- 新增可选字段不升 `schema`，但必须提高 `engine` 的最低版本；旧宿主会拒绝未知字段，
  安装器应提示「需要更新 Sill」，而不是静默忽略。
- 组件版本遵循 semver；宿主只按 `id` 识别组件，不按路径。
