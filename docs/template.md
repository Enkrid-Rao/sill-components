# Template 组件

> 这份文档已合并到 [authoring.md](authoring.md)。写组件请只读那一份，避免两套说法漂移。
> 这里只保留最容易被引用的结论。

- 模板 = `widget.json` + `ui/index.html`（+ 可选 `style.css` / `main.js` / `ui/**`）。
- HTML 原样挂到卡片的 Shadow DOM 里，不做标签/属性审查；`<script>` 标签不执行。
- 要写 JS 就放 `ui/main.js`：它在面板页面里执行一次，宿主注入 `sill` 和 `root`。
- 数据更新是增量的：只改绑定文本、`--sill-value`、`[hidden]` 和列表行。
- 玻璃 / 圆角 / 阴影 / 主题由 `.card` 提供，模板只画内容，不要再铺一层背景。

为什么不是 iframe：Sill 的玻璃在 `.card` 上、atmosphere 在它背后，iframe 会切断这条链，
只能得到不透明白底或一层仿玻璃。模板直接作为卡片子内容渲染，材质是同一层。
