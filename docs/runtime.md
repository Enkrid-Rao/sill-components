# Runtime contract

模板组件运行在宿主 renderer 里：HTML/CSS 挂到 Shadow DOM，`ui/main.js`（可选）作为宿主页面脚本
执行一次，之后靠 `sill.onData` 接收更新。`<script>` 标签仍然不会执行（innerHTML 规则）。

**当前状态：** Sill 开发分支已有模板渲染、动态布局和本地 `.sill` 安装；正式 0.5.4 没有这些。
CLI、目录下载和权限确认还没完成。这份文档是运行契约。

## 1. 生命周期

```text
validate → load → mount → update → dispose
```

| 阶段 | 做什么 | 失败时 |
|---|---|---|
| `validate` | 校验 manifest、权限、路径、大小、绑定 | 不加载，安装器不写文件 |
| `load` | 读取 `ui/index.html` 与 `ui/style.css` | 卡片显示错误占位 |
| `mount` | 在 `.card` 内建立 shadow root，写入 HTML/CSS，执行一次 `ui/main.js` | 只影响当前卡片 |
| `update` | 只更新绑定的文本、CSS 变量和可见性 | 保留上一帧，记录错误 |
| `dispose` | 卸载时清空 shadow root、解绑监听 | 记录泄漏警告 |

模板没有 `show` / `hide` 回调；它只描述静态内容，宿主负责显示/隐藏。

## 2. 渲染位置

```text
WidgetShell
  └─ section.card          # 玻璃、圆角、边框、padding
       └─ shadow root      # 模板 HTML + CSS
            └─ 内容
```

- 玻璃和 atmosphere 由 `.card` 与背后的 `.rail__atmo` 提供；
- 模板不拥有卡片背景，不要给 `:host` / 根节点铺背景；
- Shadow DOM 继承宿主的 CSS 自定义属性；
- 模板不能创建窗口、不能注册全局快捷键、不能阻止面板收起。

## 3. 绑定

```html
<div data-sill-text="now.time"></div>
<div data-sill-text="system.cpu.usage"></div>
```

- 根来自 manifest `data[].id`；`data-sill-repeat` 内部额外有 `item`；
- 字段来自 [providers.md](providers.md)；
- 缺失 / null / 求值失败显示 `—`；
- v1 有文本、i18n、`data-sill-if`、`data-sill-repeat`、`data-sill-action`、`data-sill-meter`；
  没有表达式函数和写操作（动作走白名单命令）。
- 数据 / 语言变化时只更新绑定节点，不重建 shadow root；模板内部的 CSS 过渡可以继续。

## 4. 环境

| 值 | 模板里怎么拿 |
|---|---|
| `language` | `data-sill-i18n`，或 `sill.onData(({ language }) => …)` |
| 数据 | `data-sill-text` / `data-sill-if` / `data-sill-repeat`，或 `sill.data()` |
| 主题 | CSS 变量；JS 用 `sill.onData(({ tokens }) => …)` |
| 尺寸 | 卡片内容宽度；用 CSS 响应式，不假设固定宽度 |
| 列数 | 宿主决定；模板只关心自己的内容宽度 |
| 存储 | `sill.storage.get / set / patch`，落在 `<userData>/widget-data/<id>.json` |

## 5. 尺寸与列

面板宽度连续可调，列数由宽度推导。按 0.5.4 的 CSS 估算：

| 面板宽 | 列数 | 单跨卡片内容宽 | 说明 |
|---|---|---|---|
| 320 | 1 | 254 | 最窄面板 |
| 384 | 1 | 318 | 默认 rail |
| 485 | 2 | 190 | 刚进两列 |
| 660 | 2 | 273 | board |
| 714 | 3 | 185 | 刚进三列，最窄卡片 |
| 920 | 3 | 253 | wide |
| 1180 | 3 | 340 | 单跨 |
| 1180 | 3 | 1110 | 跨 3 列 |

- 单跨模板必须能在 185px 下不横向溢出；
- 宽度不够时设 `span.default: 2` 或 3，而不是依赖 `minW` 自动重排；
- `size.w/h` 是建议值，宿主不改窗口；
- 用户 `layout.spans` 永远优先。

## 6. 主题 token

模板可用的 CSS 变量：

```css
--ink
--ink-soft
--ink-dim
--ink-faint
--accent
--accent-pale
--accent-soft
--sans
--serif
--radius
```

- 不要硬编码主题色；
- 不要用 `backdrop-filter` 或桌面采样；
- 不要复制 atmosphere 渐变；它在卡片背后；
- 主题切换时 CSS 变量自动更新，模板不需要 JS。

## 7. 错误与降级

- 模板 HTML/CSS 非法：当前卡显示错误占位，其他卡不受影响。
- 数据缺失：`—`，不抛错。
- 宿主解析失败：记录文件与原因，安装器拒绝该包。
- 模板不能阻止面板收起，也不能把宿主窗口抢到前台。

## 8. 性能预算

| 指标 | 预算 | 说明 |
|---|---|---|
| 首次渲染 | < 16 ms | 模板本身不重 |
| 数据更新 | < 4 ms | 只改绑定节点 |
| DOM 节点 | < 500 | 超过建议拆组件 |
| 常驻内存 | < 4 MB | 共享宿主 renderer |
| 定时器 | 0 | `main.js` 自己负责清理，不要无脑 `setInterval` |

## 9. 可访问性

- 模板可以使用任意 HTML / CSS 标签，包括 `<svg>`、`<img>` 和内联样式；
- `<script>` 不执行；需要 JS 写 `ui/main.js`（同页执行）；
- 纯展示内容仍需保证文字对比度；
- 中文最小字号 10.5px；正文 13.5–14px；
- 后续加 `data-sill-action` 时再补键盘与焦点规则。

## 10. 版本

- 模板契约随 `engine` 版本走；
- 新标签 / 新指令只增不改；删除或改语义必须升主版本；
- 宿主版本（`runtime`）与模板引擎版本（`engine`）是两条线。
