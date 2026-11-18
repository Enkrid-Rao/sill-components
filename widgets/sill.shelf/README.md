# Shelf

内置快捷方式收纳卡片。

## 显示什么

- 用户添加的 `.lnk` / `.exe` 快捷方式；
- 系统图标（`app.getFileIcon`）；取不到时显示 `↗`；
- 名称、点击打开、删除按钮。

不做文件管理：不移动、复制、重命名文件，也不接管桌面。

## 数据

存在 `<userData>/shelf.json`：

```json
[
  { "id": "…", "name": "Notepad", "path": "C:\\Windows\\System32\\notepad.exe", "icon": "data:image/png;base64,…" }
]
```

## 交互

- 「添加」打开系统文件选择器，支持多选；
- 点击图标调用 `shell.openPath`；
- 悬停出现删除；
- 没有拖放 / 文件夹映射 / 快捷方式编辑。

## 实现

`ShelfWidget.tsx` + `main/data/shelf.ts`；图标由主进程生成，渲染进程只显示 data URL。
