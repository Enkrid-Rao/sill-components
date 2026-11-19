# Tasks

可勾选的待办清单。点方块调用 `todo.toggle`，点右上角切换紧凑模式。

看点：

- `host.state` 一次拿全量宿主状态，`data-sill-repeat="state.todos"` 渲染列表；
- `data-sill-action-arg="item.id"` 把当前行 id 传给宿主动作；
- `sill.storage.get()` / `sill.storage.patch()` 管理组件自己的设置，不进 `.sill` 包；
- 列表行由宿主复用，JS 只按索引同步完成态。
