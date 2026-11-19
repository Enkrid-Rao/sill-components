# Wave

媒体卡：唱片封面、播放进度和四个传输控制按钮。

看点：

- `data-sill-if="media.active"` 切换光晕与空状态；
- `data-sill-meter="media.progress"` 驱动进度条；
- `data-sill-action="media.*"` 直接调宿主动作；
- `<img src="assets/vinyl.svg">` 和 CSS `url(assets/glow.svg)` 都被改写成 `sill-asset://`，
  不需要手写协议地址。
