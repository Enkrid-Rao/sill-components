# Examples

| 示例 | 类型 | 说明 |
|---|---|---|
| [clock](clock) | template | 时间 + 日期，最小静态模板 |
| [rings](rings) | template | SVG 圆环 + `data-sill-meter`，零 JS |
| [inline-clock](inline-clock) | template | 内联 `ui/main.js` + `sill.storage` |
| [processes](processes) | template | repeat / if / i18n，读 topRam |
| [media](media) | template | action / meter，媒体控制 |
| [web-clock](web-clock) | web / trusted | 完整 Node + JS |

一组更完整的展示包（都可直接安装或丢进 Skins 目录）：

| 示例 | 展示了什么 |
|---|---|
| [halo](halo) | SVG meter + CSS 过渡 + `ui/assets/**` 自动改写 |
| [analog](analog) | 内联 `ui/main.js` + `time.now` 驱动指针 |
| [tasks](tasks) | `host.state` + repeat + `todo.toggle` + `sill.storage` |
| [wave](wave) | 媒体动作 + if / meter + 包内 SVG 封面 |

示例以「能直接打成 `.sill` 安装」为目标。

现在可以用它做的：

- 丢进 Skins 目录（`%APPDATA%\Sill\skins\`）保存即刷新；
- 在 Sill 开发分支里用 `SILL_DEV_WIDGET` 预览；
- 压成 `.sill`，从设置 → 组件 → 安装组件… 安装；
- 用 `python scripts/validate.py` 检查契约。

正式目录下载还没开放。
