# `.sill` 包与安装

`.sill` 就是改了扩展名的 zip。Sill 0.6.0 支持本地 / URL / 目录安装与更新；签名仍未做。
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
- `settings` 可选：组件设置声明，宿主渲染表单，值存 `<userData>/widget-settings/<id>.json`；
- `data[].source` 必须是已知 provider（见 [providers.md](providers.md)）。

template 的 HTML/CSS **不做标签/属性审查**：`<script>` 由 `innerHTML` 规则保证不执行，
`on*`、内联 `style`、`svg`、`img`、`url()`、`@import` 都是正常写法。要写 JS 放 `ui/main.js`。

## 打包

在 Sill 工作区里：

```bash
pnpm sill pack ./my-widget -o clock.sill
```

全局 CLI（0.3.1+）：

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

也可以不落地文件：设置 → 组件 → **从 URL 安装** 粘贴 https 直链，或从 **组件目录** 里点安装
（目录条目需要 `installable: true` + `download`）。下载后仍然按包内容重新校验、按能力档位提示，
和本地安装没有区别。目录里的 `version` 比本地新时，组件页还会把已安装组件列进「组件更新」，
点一下就走覆盖安装（布局槽位保留）。

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

同一个 `id` 只保留一个版本：

- 已经装了**同一个版本**再装会被拒绝；
- 新版本直接覆盖旧目录（upgrade-in-place），布局槽位、顺序、显示/隐藏状态都保留；
- 降级也走同一条路径（没有版本回滚提示）；
- 卸载会删除包目录并把 id 从布局移除；重新安装会追加到末尾。

## 权限与信任

安装前会显示 id、名称、版本、作者、能力档位和读取的数据，确认后才写入。v1 没有签名 / 哈希。

能力档位由包内容算出，不由作者声明：

| 档位 | 判定 | 提示 |
|---|---|---|
| `static` | template 且没有 `main.js` / `on*` / `<script>` | 不弹窗，直接装 |
| `script` | template 且会执行代码 | 警告：权限与 Sill 相同 |
| `isolated` | web，无 Node | 说明只走组件桥 |
| `node` | web + `trust: "trusted"` | 完整 Node，需要勾选确认 |

确认过的 id 记在 `<userData>/trust.json`；同 id 能力不升时不再询问。见 [security.md](security.md)。

后续会补：签名 / 哈希、自动安装更新。

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


