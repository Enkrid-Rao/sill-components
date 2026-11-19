# Halo

三道发光弧线显示 CPU / 内存 / 显卡占用。纯模板，零 JS。

看点：

- `data-sill-meter` 把 0–100 读数写成 `--sill-value`，CSS 用 `stroke-dashoffset` 画弧；
- `ui/assets/grain.svg` 在 CSS 里写成 `url(assets/grain.svg)`，宿主自动改写为
  `sill-asset://sill.showcase.halo/ui/assets/grain.svg`；
- 同一套 `--accent` / `--accent-2` / `--accent-pale` 跟着主题走。

```bash
node packages/cli/bin/sill.js pack examples/halo -o examples/halo/halo.sill
```
