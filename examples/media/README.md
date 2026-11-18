# Media

演示 `data-sill-action`：

```html
<button data-sill-action="media.playpause">▶</button>
```

- 需要 `data.media` 读会话；
- 需要 `action.media` 才能发播放 / 上一首 / 下一首 / 静音；
- `data-sill-meter="media.progress"` 写入 `--sill-value`，CSS 用它算进度条宽度；
- 动作在宿主里执行，模板没有 JS；
- 没有 `action.media` 时点击无效。
