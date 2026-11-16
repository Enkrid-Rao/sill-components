# Counter

脚本组件示例：一个持久化计数器，用来验收 sandbox、storage 和主题注入。

```text
counter/
├─ widget.json
└─ ui/main.js
```

## 它演示什么

- `type: script` 与 `permissions: ["storage"]`；
- 单文件 ES module，默认导出 `mount` / `update` / `hide` / `dispose`；
- `ctx.storage` 按组件 id 隔离、升级保留、卸载删除；
- `ctx.theme` 注入颜色与字体；
- 主题 / 语言变化走 `update`，不整页重载。

## 现在能做什么

Sill 0.5.1 还没有脚本沙箱，所以它不能加载。它能做的是：

```bash
python scripts/validate.py
```

校验 manifest、`ui/main.js` 存在、权限声明与文件大小。沙箱落地后：

```bash
sill validate ./counter
sill dev ./counter
```

## 验收

- 点击 +1，数字与存储都更新；重开面板后从存储恢复。
- 卸载后 `widget-data/sill.counter/` 被删除，重装从 0 开始。
- 主题切换后按钮颜色跟随 `ctx.theme.accent`，不残留旧颜色。
- 沙箱里 `require` / `fetch` / `window.open` 都不可用。
- 崩溃只影响这张卡，面板其他部分正常。
