# `.sill` 包与安装

`.sill` 就是改了扩展名的 zip。Sill 开发分支支持从本地文件安装，还没有目录下载、签名和 CLI。

## 包结构

压缩包根目录：template 是三个文件，web 再加 `ui/main.js`：

```text
widget.json
ui/index.html
ui/style.css
ui/main.js        # web only
```

- template 不能带 JS；web 只能多一个 `ui/main.js`；两者都不能带图片、字体或额外目录；
- 不能有顶层文件夹（不能是 `clock/widget.json`）；
- 路径不能包含 `..`、反斜杠、盘符或绝对路径；
- 压缩包 ≤ 10 MB，单文件 ≤ 1 MB。

## manifest 限制

安装器会再次校验 `widget.json`，不只是看 schema：

- `schema` 必须为 `1`；
- `id` 至少两段，小写，全局唯一；
- `version` 是 semver；
- `type` 是 `template` 或 `web`；
- web 的 `trust` 是 `sandboxed` 或 `trusted`；
- `license`、`runtime`、`engine` 不能为空；
- `permissions` 只能是 `data.time` / `data.system` / `data.media` / `data.weather` / `data.todo` /
  `action.media` / `action.todo`；
- `ui` 必须是 `ui/index.html`；
- `span.default` 在 1–3。

template 的 HTML/CSS 还会被检查：不能有 `<script>`、`on*`、`style` 属性、`href` / `src`、
`@import`、`url()`、`expression()`。web 的 JS 不检查，它本来就能执行任意代码；trusted 需要安装警告。

## 打包

在 Sill 工作区里：

```bash
pnpm sill pack ./my-widget -o clock.sill
```

不用 CLI 时，在组件目录里：

```powershell
Compress-Archive -Path widget.json,ui -DestinationPath clock.zip -Force
Rename-Item clock.zip clock.sill
```

压缩包根目录必须是 `widget.json` 和 `ui/`，不要先套一层文件夹。

## 安装

1. 设置 → 行为 → 组件 → 安装组件…；
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

## 权限

安装前会显示 id、名称、版本、作者、类型、信任级别、权限和提醒，确认后才写入。v1 没有签名 / 哈希。
template 只能读 manifest 声明的 provider；web 的 `trust: "trusted"` 拥有完整 Node，安装时显示完全信任警告。
安装第三方 `.sill` 仍然等于信任作者，和安装任何本地程序一样。

后续会补：签名 / 哈希、目录下载、自动更新。

## 失败时

安装失败不会留下半个包：

- 临时目录会被清理；
- 目标目录不会创建；
- 返回具体错误（缺文件、字段非法、路径穿越、超过大小、模板含脚本等）。

常见错误：

| 错误 | 原因 |
|---|---|
| `组件包包含不允许的文件` | 带了 README、图片或顶层文件夹 |
| `widget.json 字段不合法` | 缺 license / runtime / engine，或 type 不是 template |
| `模板不能包含 script、on* 或 style 属性` | HTML 不干净 |
| `CSS 不能包含 @import、url() 或 expression()` | CSS 不干净 |
| `这个组件已经安装` | 同 id 已存在 |
