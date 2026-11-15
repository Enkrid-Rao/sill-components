# Roadmap

这份路线图把“组件开发”拆成可以验收的阶段。每个阶段都以 Sill 主仓库的
`docs/HANDOFF.md` 为准；本仓库只描述组件侧的契约。

## v0.1 — 规范（当前）

- [x] manifest / IR / runtime / script / security / testing 文档
- [x] JSON Schema
- [x] clock 声明式示例
- [x] script counter 示例（目标 API）
- [ ] 与 Sill `packages/engine` 的接口对齐评审

**完成标准：** 一个第三方作者只看这个仓库，能写出合法的 manifest 和 IR，
并知道哪些能力还不存在。

## v0.2 — IR 引擎

在 Sill 主仓库实现：

- [ ] `packages/engine`：parse / validate / compile / bind
- [ ] vstack / hstack / text / bar / divider / spacer / image
- [ ] token 样式解析（含中文/英文）
- [ ] 错误占位与开发者错误信息
- [ ] 单元测试：节点白名单、绑定求值、越界/非法输入

**完成标准：** clock 示例不写 React 就能在面板里显示，宽度 320–1180 无溢出。

## v0.3 — CLI 与开发体验

- [ ] `sill validate <dir>`
- [ ] `sill dev <dir>`（热重载 + provider 面板）
- [ ] `sill pack <dir>`（`.sill` zip）
- [ ] manifest JSON Schema 校验
- [ ] 模板：`sill new <id>`

**完成标准：** 作者从零到本地预览 ≤ 5 分钟。

## v0.4 — 安装器

- [ ] `.sill` 解压安全（路径逃逸 / zip bomb / 大小）
- [ ] 安装确认页（权限、域名、大小、作者）
- [ ] 组件目录 `%APPDATA%/Sill/components/<id>@<version>`
- [ ] 启用/禁用/卸载
- [ ] 版本升级与回滚

**完成标准：** 安装 clock 示例后，布局里出现卡片；卸载后无残留。

## v0.5 — 脚本沙箱

- [ ] sandbox iframe + CSP
- [ ] 结构化消息协议
- [ ] ctx.data / storage / fetch / commands
- [ ] 超时、内存、崩溃隔离
- [ ] 网络白名单与配额
- [ ] 开发者日志面板

**完成标准：** counter 示例可持久化、崩溃不影响面板；恶意 `eval`/`fetch` 被拒绝。

## v0.6 — 发布与生态

- [ ] 组件索引 / 搜索（可选）
- [ ] 签名与哈希
- [ ] 自动更新（组件级）
- [ ] 主题 token 版本化
- [ ] 组件作者文档站

## 非目标

- 不做任意 Node 模块加载。
- 不做组件内直接窗口/托盘/全局热键。
- 不做“组件市场”优先于引擎；先把契约和本地加载跑通。
- 不做绝对定位/canvas 的声明式 IR；这些交给脚本组件。
