# Clock

最小声明式组件：时间 + 日期 + 一行本地化标签，不写 JS。

```text
clock/
├─ widget.json
├─ ui/layout.json
└─ locales/
   ├─ en.json
   └─ zh.json
```

## 它演示什么

- manifest 的最小字段：`id`、`runtime`、`engine`、`type`、`permissions`、`data`、`ui`；
- 数据绑定：`data[].id = "now"` → IR 里用 `now.time` / `now.dateLabel`；
- `i18n` 与 `locales`：标签随语言切换；
- `text` 的两种 token：`caption` 与 `display`。

## 现在能做什么

Sill 0.5.1 还没有 IR 引擎，所以它**不能**直接加载。它能做的是：

```bash
python scripts/validate.py
```

校验 manifest、IR、locales 与绑定根名。引擎落地后：

```bash
sill validate .
sill dev .
```

## 尺寸

- 建议 384 × 160。
- 单跨。最窄要能在 185px 下放下：`display` 时间会缩小到 token 允许的最小字号，
  日期用 `maxLines: 1` 截断。
- 中文 `caption` 不会低于 10.5px。

## 验收

- 320 / 384 / 714 / 1180 面板宽下不横向溢出。
- `zh` / `en` 切换后标签与日期都变，不残留旧语言。
- 时间每分钟更新，日期跨天更新。
- 没有 provider 时不抛错，显示 `—`。
