# Roadmap

每个阶段都以可验收的东西结束。规范在本仓库，引擎 / 安装器 / 沙箱在 Sill 主仓库；
两边用 `engine` 版本对齐。

## v0.1 — 规范（已发布，tag `v0.1.0`）

- [x] manifest / IR / runtime / script / security / testing 文档
- [x] manifest JSON Schema
- [x] clock 声明式示例
- [x] counter 脚本示例（目标 API）

**完成标准：** 一个第三方作者只看这个仓库，能写出合法的 manifest 与 IR，并知道哪些能力还不存在。
v0.1 的问题也很清楚：尺寸数字写错、`network` / `span` 字段缺失、runtime 与宿主脱节。

## v0.2 — 规格收口与官方目录（当前）

- [x] 修正尺寸契约（185–1110 的卡片内容宽）
- [x] `network` / `span` / `fonts` / `engine` 进 schema
- [x] 数据 provider 契约（`docs/providers.md` + `spec/providers.json`）
- [x] 命令目录（`spec/commands.json`）
- [x] IR / catalog JSON Schema
- [x] 官方组件目录（五个内置组件）
- [x] `scripts/validate.py` + fixtures + CI
- [x] v1 明确为「只读声明式」，交互走脚本
- [ ] 与 Sill `packages/engine` 的接口对齐评审

**完成标准：** `python scripts/validate.py` 全绿；五个内置组件在目录里有可读的说明与源码链接；
第三方作者不会再因为文档与 schema 冲突而写出装不上的包。

## v0.3 — 只读 IR 引擎

在 Sill 主仓库实现：

- [ ] `packages/engine`：parse / validate / compile / bind
- [ ] vstack / hstack / overlay / text / image / bar / ring / divider / spacer / list / button
- [ ] token 样式解析（含中文 / 英文）
- [ ] 表达式求值（`format` / `round` / `floor` / `ceil` / `if` / `and` / `or` / `not`）
- [ ] 错误占位与开发者错误信息
- [ ] 单元测试：节点白名单、绑定求值、越界 / 非法输入
- [ ] system / processes 先搬成声明式实现

**完成标准：** clock 示例不写 React 就能在面板里显示；185 / 253 / 318 / 1110 四个宽度无溢出；
system 与 processes 至少有一个完全由 IR 渲染。

## v0.4 — CLI 与开发体验

- [ ] `sill validate <dir>`（与 `scripts/validate.py` 共享规则）
- [ ] `sill dev <dir>`（热重载 + provider 面板）
- [ ] `sill pack <dir>`（`.sill` zip）
- [ ] `sill new <id>`（模板）
- [ ] 错误码与 `--json` 输出

**完成标准：** 作者从零到本地预览 ≤ 5 分钟；validate 的错误能直接定位到文件与字段。

## v0.5 — 安装器

- [ ] `.sill` 解压安全（路径逃逸 / zip bomb / 大小）
- [ ] 安装确认页（权限、域名、大小、作者、来源）
- [ ] 目录 `userData/components/<id>@<version>`
- [ ] 启用 / 禁用 / 卸载
- [ ] 版本升级与回滚
- [ ] 可安装的示范组件（clock / system）

**完成标准：** 安装 clock 示例后卡片出现在布局里；卸载后组件目录与存储都没有残留；
新增权限的升级会重新弹确认。

## v0.6 — 脚本沙箱

- [ ] sandbox iframe + CSP + nonce
- [ ] MessagePort 结构化消息
- [ ] `ctx.data` / `storage` / `settings` / `fetch` / `command`
- [ ] 超时、内存、崩溃隔离
- [ ] 网络白名单、IP 复查、重定向检查、配额
- [ ] 开发者日志面板
- [ ] counter 示例可持久化

**完成标准：** counter 示例可持久化、崩溃不影响面板；恶意 `eval` / 直接 `fetch` / 读宿主 DOM
全部被拒绝；卸载后存储删除。

## v0.7 — 目录与生态

- [ ] 目录下载与更新（`catalog.json` 消费方）
- [ ] `verified` 第三方审核流程
- [ ] 组件级自动更新
- [ ] 签名 / 哈希（v1 之前明确不做，现在仍不做）
- [ ] 主题 token 版本化
- [ ] 作者文档站

**完成标准：** 第三方组件能通过目录安装、升级、回滚；下架的组件不再被推荐，
但已安装的仍可卸载。

## 非目标

- 不做任意 Node 模块加载。
- 不做组件内直接窗口 / 托盘 / 全局热键。
- 不做「组件市场」优先于引擎；先把契约、引擎与本地安装跑通。
- 不做绝对定位 / canvas 的声明式 IR；这些交给脚本组件。
- v1 不做声明式本地状态；等 v1.1 单独讨论，不偷偷塞进 v1。
