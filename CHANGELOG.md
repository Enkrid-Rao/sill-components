# Changelog

## v0.3 — 未发布

这一版把组件模型从 JSON IR / iframe 换成 **template**。

### 变更

- 组件 = `widget.json` + `ui/index.html` + `ui/style.css`；
- 模板直接渲染进 `WidgetShell` 的 `.card`（Shadow DOM），玻璃和 atmosphere 原生复用；
- 删除 `declarative` / `script` 类型、IR 节点、脚本沙箱和 iframe 相关契约；
- 只读数据用 `data-sill-text`；v1 不执行 JS、不联网、不写数据；
- 权限只保留 `data.time/system/media/weather/todo`；
- 校验器重写：manifest、HTML 白名单、CSS 限制、包大小；
- 示例改为 template clock，删除 counter。

### 删除

- `docs/ir.md`、`docs/scripts.md`
- `spec/layout.schema.json`、`spec/commands.json`
- `examples/counter`
- 旧 IR / script fixtures

## v0.2 — 2026-11

- 修正尺寸、网络、engine 契约；
- 增加 provider / 命令目录、目录 schema、官方组件目录、校验脚本与 CI。

## v0.1.0 — 2026-11

首个规范版本：manifest / IR / runtime / script / security / testing / roadmap。
