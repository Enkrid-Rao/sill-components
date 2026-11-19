# com.example.inlineclock

模板 + 内联 `ui/main.js` 的最小示例：读时间、点按钮计数、私有存储。

`ui/main.js` 在宿主页面里执行一次，宿主注入 `sill` 和 `root` 两个参数：

- `sill.onData(cb)` 每次快照 / 语言变化回调；
- `sill.storage.get/set/patch` 读写 `<userData>/widget-data/<id>.json`；
- `root` 是这张卡的 shadow root，直接 `root.querySelector(...)`。

不需要 webview，没有固定高度，CSS 变量（`--accent`、`--serif`）和内置卡完全一致。

## 数据与权限

| 数据 | provider | 权限 |
|---|---|---|
| 时间 | `time.now` | `data.time` |

## 安装

```powershell
sill pack . -o inline-clock.sill
```

设置 → 组件 → 安装组件…；或直接把整个文件夹丢进 Skins 目录。
