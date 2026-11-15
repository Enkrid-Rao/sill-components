# Clock

最小声明式组件：时间 + 日期，不写 JS。

```
clock/
├─ widget.json
├─ ui/layout.json
└─ locales/
   ├─ en.json
   └─ zh.json
```

当前 Sill（0.4）还没有 IR 引擎，所以这份示例是给
`packages/engine` 的验收用例：在 320–1180 宽下显示时间/日期，
中文 caption 不小于 10.5px，英文不换行溢出。

运行方式（引擎落地后）：

```bash
sill validate .
sill dev .
```
