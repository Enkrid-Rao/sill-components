# Examples

| 示例 | 类型 | 说明 |
|---|---|---|
| [clock](clock) | template | 时间 + 日期，最小静态模板 |
| [rings](rings) | template | SVG 圆环 + `data-sill-meter`，零 JS |
| [inline-clock](inline-clock) | template | 内联 `ui/main.js` + `sill.storage` |
| [processes](processes) | template | repeat / if / i18n，读 topRam |
| [media](media) | template | action / meter，媒体控制 |
| [web-clock](web-clock) | web / trusted | 完整 Node + JS |

示例以「能直接打成 `.sill` 安装」为目标。

现在可以用它做的：

- 丢进 Skins 目录（`%APPDATA%\Sill\skins\`）保存即刷新；
- 在 Sill 开发分支里用 `SILL_DEV_WIDGET` 预览；
- 压成 `.sill`，从设置 → 行为 → 组件 → 安装组件… 安装；
- 用 `python scripts/validate.py` 检查契约。

正式目录下载还没开放。
