# Web Clock

`type: "web"` + `trust: "trusted"`：`ui/main.js` 里直接 `require('node:os')`。

- 完整 Node，不是 provider 白名单；
- `sill.ready` 拿宿主数据；
- 安装时必须显示 full-access 警告；
- 不能进 sandboxed 市场。

这是开发原型，`.sill` 安装已经支持 `type: "web"`。
