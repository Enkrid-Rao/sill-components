# Analog Clock

SVG 表盘 + 内联 `ui/main.js`。时间由 `time.now` provider 每秒推送，脚本只建一次刻度，
之后只改三根指针的 `transform`。

看点：

- `sill.onData(({ data }) => ...)` 拿当前快照；
- `<script>` 标签在模板里不会执行，JS 必须放 `ui/main.js`；
- `data-sill-text` 继续负责日期和数字时间，JS 只做声明式绑定不擅长的部分。
