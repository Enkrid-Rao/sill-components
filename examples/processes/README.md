# Top RAM

演示 `data-sill-repeat`、`data-sill-if`、`data-sill-i18n`。

```text
processes/
├─ widget.json
└─ ui/
   ├─ index.html
   └─ style.css
```

- `data-sill-repeat="processes.topRam"` 克隆行；
- 行内 `item.name` / `item.mb` 读取当前项；
- `data-sill-if="!processes.topRam.length"` 只在空列表时显示空态；
- `data-sill-i18n` 用 manifest 的 `strings`。

`system.processes` 现在只有按内存排序的 `topRam`，没有每进程 GPU 占用；
需要 GPU 进程数据的组件要等宿主新增 provider。
