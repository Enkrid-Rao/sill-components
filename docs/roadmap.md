# Roadmap

每个阶段都以可验收的东西结束。规范在本仓库，宿主/引擎/安装器在 Sill 主仓库；
两边用 `engine` 版本对齐。

## v0.1 — 旧规范（已发布，tag `v0.1.0`）

- [x] manifest / IR / runtime / script 文档
- [x] JSON Schema
- [x] clock / counter 示例

这一版后来被证明方向不对：JSON IR 表达力不够，iframe 切断卡片玻璃，无法和内置卡视觉一致。

## v0.2 — 规格收口（已推送，未打 tag）

- [x] 尺寸 / provider / 权限 / 目录 schema
- [x] `scripts/validate.py`、fixtures、CI
- [x] 五个内置组件目录

## v0.3 — Template 模型（当前）

- [x] 模板格式：`widget.json` + `ui/index.html` + `ui/style.css`
- [x] 模板直接渲染进 `.card` 的 Shadow DOM
- [x] 玻璃 / atmosphere 复用卡片本体，不模拟
- [x] HTML 白名单、CSS 限制、`data-sill-text`
- [x] 校验器与 fixtures 切到 template
- [x] 模板示例 clock
- [ ] 与 Sill 主仓库的模板引擎接口对齐评审

**完成标准：** 一个只读 `render` 示例在 Sill 开发分支里通过 `SILL_DEV_WIDGET` 显示，
视觉与内置卡一致；`python scripts/validate.py` 全绿。

## v0.4 — 宿主模板引擎

在 Sill 主仓库实现：

- [ ] 动态卡片 id，模板卡进入 `layout.json`
- [ ] manifest 校验 + HTML/CSS sanitizer
- [ ] Shadow DOM 渲染、绑定更新
- [ ] 语言 / 主题 / 尺寸变化
- [ ] 错误占位与开发者错误信息
- [ ] 单元测试：白名单、绑定、缺失数据

**完成标准：** 不设置开发开关也能从文件夹加载模板卡；拖拽、跨列、隐藏、重启保持。

## v0.5 — CLI 与安装器

- [ ] `sill validate <dir>`
- [ ] `sill dev <dir>`（热重载 + 错误面板）
- [ ] `sill pack <dir>`（`.sill` zip）
- [ ] 安装器：临时目录 + 原子 rename + 权限确认
- [ ] 卸载 / 版本升级
- [ ] `sill new <id>` 模板

**完成标准：** 作者从零到本地预览 ≤ 5 分钟；安装 clock 后卡片出现在布局里；卸载无残留。

## v0.6 — 模板能力

- [ ] `data-sill-i18n`
- [ ] `data-sill-if` / `data-sill-repeat`
- [ ] `data-sill-action`（media / todo / panel）
- [ ] 只读 `storage`（可选，需重新评估权限）
- [ ] 资源白名单（图片 / 字体，走自定义协议）
- [ ] 更严格的 sanitizer 测试集

**完成标准：** 天气、媒体、待办这类卡能用模板写，不再依赖内置 React。

## v0.7 — 目录与生态

- [ ] 目录下载 / 更新
- [ ] `verified` 第三方审核流程
- [ ] 组件级签名 / 哈希
- [ ] 官方 template repo 与文档站
- [ ] 组件提交 CI

**完成标准：** 第三方组件能通过目录安装、升级、回滚；官方 template 一键起步。

## 非目标

- 不做 rmskin 兼容；真有人拿旧皮肤来问，再单独评估桥接。
- 不做任意 JS 模板；需要 JS 的组件走独立沙箱，不混进 v1。
- 不做绝对定位 / 自由桌面摆放；那是另一套窗口模型。
- 不做组件市场优先于引擎；先把模板和安装跑通。
