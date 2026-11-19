# `.sill` 包与安装

`.sill` 就是改了扩展名的 zip。Sill 0.6 开发版支持从本地文件安装，还没有目录下载和签名。
比安装更快的是 Skins 目录：把组件文件夹放进 `<userData>/skins/` 即可，保存即刷新。

## 包结构

根目录只放元数据，其余文件都在 `ui/` 下：

```text
widget.json
README.md          # 可选
LICENSE            # 可选
ui/
├─ index.html      # 必需
├─ style.css       # 可选
├─ main.js         # 可选（template 同页执行；web 必需）
├─ lib/**          # 随意拆
├─ assets/**       # 图片、字体
└─ fonts/**
```

- `ui/` 下可以随便建目录；宿主不限制文件名；
- 不能有顶层文件夹（不能是 `clock/widget.json`）；
- 路径不能包含 `..`、反斜杠、盘符或绝对路径；
- 压缩包 ≤ 50 MB，单文件 ≤ 20 MB，文件数 ≤ 500；
- 不要放 `node_modules`、`.git`、`dist`。

## manifest 限制

安装器会再次校验 `widget.json`，不只是看 schema：

- `schema` 必须为 `1`；
- `id`：小写字母/数字/`.`/`-`/`_`，2–64 字符，全局唯一；
- `name`：非空，超过 40 字符截断；
- `version` 是 semver（允许 `-beta` / `+build`）；
- `type` 是 `template` 或 `web`；
- `ui` 必须是 `ui/index.html`；
- `span.default` 如果写了，必须在 1–3（不写按 1）；
- `author` / `license` / `runtime` / `engine` 可选（分别缺省 `unknown` / `UNLICENSED` / 元数据）；
- `permissions` 可选，是给安装提示看的元数据，不做运行时拦截；
- `data[].source` 必须是已知 provider（见 [providers.md](providers.md)）。

template 的 HTML/CSS **不做标签/属性审查**：`<script>` 由 `innerHTML` 规则保证不执行，
`on*`、内联 `style`、`svg`、`img`、`url()`、`@import` 都是正常写法。要写 JS 放 `ui/main.js`。

## 打包

在 Sill 工作区里：

```bash
pnpm sill pack ./my-widget -o clock.sill
```

全局 CLI（0.3.0+）：

```bash
npm i -g @heavenlydemon/sill-cli
sill pack ./my-widget
```

不用 CLI 时，在组件目录里：

```powershell
Compress-Archive -Path widget.json,ui,README.md -DestinationPath clock.zip -Force
Rename-Item clock.zip clock.sill
```

压缩包根目录必须是 `widget.json` 和 `ui/`，不要先套一层文件夹。

## 安装

安装版 Sill 会注册当前用户级 `.sill` 关联：双击 `.sill`，或右键 → *Install with Sill*，
会走和下面相同的确认流程。绿色版不自动写注册表，可在 设置 → 组件 → `.sill 文件关联`
里手动注册 / 取消。

1. 设置 → 组件 → 从 .sill 文件安装…；
2. 选择 `.sill`；
3. 校验通过后解压到临时目录，再原子重命名到：

```text
<userData>/components/<id>@<version>/
```

4. 组件 id 加到布局末尾，面板立即出现；
5. 设置里的「组件」列表可以隐藏 / 显示；
6. 已安装列表可以卸载；卸载会删除包目录并把 id 从布局移除。

`<userData>` 的取值：

- 安装版：`%APPDATA%\Sill`
- 便携版：exe 旁的 `Sill-data`

## 版本与升级

v1 同一个 `id` 只允许一个版本：

- 已安装时再装同 id 会被拒绝；
- 升级要先卸载再安装；
- 卸载不会删除待办、全局设置或主题；
- 卸载会把 id 从布局移除；重新安装按新 id 追加到末尾，不保留旧位置。

## 权限与信任

安装前会显示 id、名称、版本、作者、类型、权限和提醒，确认后才写入。v1 没有签名 / 哈希。

- `template` 与宿主同页运行，`main.js` / `on*` 能访问全部宿主 IPC；
- `web` + `trust: "trusted"` 拥有完整 Node；
- `web` + `trust: "sandboxed"` 只走桥。

`permissions` 只用于提示，不构成运行时边界。见 [security.md](security.md)。

后续会补：签名 / 哈希、信任分级（静态组件免提示）、目录下载、自动更新。

## 失败时

安装失败不会留下半个包：

- 临时目录会被清理；
- 目标目录不会创建；
- 返回具体错误（缺文件、字段非法、路径穿越、超过大小）。

常见错误：

| 错误 | 原因 |
|---|---|
| `组件包包含不允许的文件` | 文件不在根目录元数据或 `ui/` 下 |
| `缺少 ui/index.html` | 入口文件不在包里 |
| `widget.json 字段不合法` | 缺 `schema`/`id`/`name`/`version`/`type`/`ui`，或类型不对 |
| `这个组件已经安装` | 同 id 已存在 |
