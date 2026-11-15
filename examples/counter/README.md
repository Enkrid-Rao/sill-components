# Counter

脚本组件示例：一个持久化计数器，用来验收 sandbox、storage 和主题注入。

```
counter/
├─ widget.json
└─ ui/main.js
```

**当前状态：** 这段代码按 v1 的 `ctx` API 编写，Sill 0.4 还没有脚本沙箱，
所以不能直接加载。它用于：

- 校验 manifest 的 `type: script` / `permissions: ["storage"]`
- 验证 sandbox 不暴露 `require` / `fetch` / 宿主 DOM
- 验证 storage 按组件隔离、卸载后保留
- 验证主题 token 注入（`ctx.theme`）和语言切换

引擎落地后：

```bash
sill validate .
sill dev .
```
