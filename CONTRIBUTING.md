# Contributing

这个仓库放**组件契约、官方目录、文档和示例**；宿主实现（窗口、provider、IR 引擎、沙箱）在
[Sill 主仓库](https://github.com/Enkrid-Rao/sill)。

## 可以提什么

- 规范歧义、字段缺口、示例错误
- 新的声明式组件示例（不要求现在能直接运行）
- 官方目录条目的补充：来源、权限、尺寸、失败表现
- 安全边界 / 权限模型的改进
- 文档排版、中文翻译、错别字

## 不要提什么

- 在示例里加 Node / Electron API
- 绕过权限模型的「便利接口」
- 依赖未声明网络的组件
- 直接修改 `schema: 1` 的语义；破坏性变更先开 issue 讨论升版
- 把「计划中」写成「已实现」；状态只写在 [STATUS.md](STATUS.md)

## 修改流程

1. 改文档、schema、示例或目录。
2. 跑校验：

   ```bash
   python -m pip install -r requirements.txt
   python scripts/validate.py
   ```

3. 如果改了 manifest 字段，同时更新：
   - `spec/widget.schema.json`
   - `docs/manifest.md`
   - `spec/fixtures/manifest/valid` 与 `invalid` 里至少各一条
   - 至少一个 example
4. 如果改了 IR 节点，同时更新：
   - `spec/layout.schema.json`
   - `docs/ir.md`
   - `docs/testing.md` 的验收项
   - `spec/fixtures/layout/valid` 与 `invalid`
   - 一个最小示例
5. 如果改了 provider 或命令，同时更新：
   - `spec/providers.json` / `spec/commands.json`
   - `docs/providers.md`
   - 用到它的示例
6. 如果加了官方目录条目，更新 `registry/catalog.json`，并确保 `docs` 路径存在。
7. 提交前确认没有把「计划中」写成「已实现」。

## 本地校验

```bash
python scripts/validate.py            # 全仓库
python scripts/validate.py ./my-widget  # 单个组件
```

它会：

- 解析仓库内的 JSON；
- 用 Draft 2020-12 + format checker 校验 manifest / IR / catalog；
- 检查示例与目录的路径、权限、settings、绑定根名、动作名；
- 跑 `spec/fixtures/*/valid` 与 `invalid` 的正反用例；
- 检查 `registry/catalog.json` 的 id 唯一性与 `docs` 文件存在。

不想装依赖时，至少用 `python -m json.tool` 逐个检查 JSON 可解析；
Windows PowerShell 也一样。

## Fixtures

- `spec/fixtures/manifest/valid/`：必须通过 schema 的最小 manifest；
- `spec/fixtures/manifest/invalid/`：必须被 schema 拒绝的 manifest；
- `spec/fixtures/layout/valid/`：必须通过 schema 的 IR；
- `spec/fixtures/layout/invalid/`：必须被 schema 拒绝的 IR；
- `spec/fixtures/catalog/valid/`：必须通过 schema 的目录。

新增规则时先加 fixture，再改 schema 和文档。fixture 只测结构，不做语义检查；
语义检查放在 `scripts/validate.py` 里。

## 官方目录

`registry/catalog.json` 的条目不是组件包。加条目前先确认：

- 组件有 `widget.json`（如果它已经是 `.sill` 包）；
- 权限是实际使用的最小集；
- 网络域名在 manifest 里声明；
- `docs` 指向本仓库内的说明页；
- `installable` 与事实一致：没有安装通道时必须是 `false`。

内置组件的 `source.ref` 指向 Sill 的发布标签；不要指向 `main`。

## 文档风格

- 中文为主，术语保留英文（manifest / IR / provider / sandbox / token）。
- 先写范围，再写字段；「v1 只读」这类边界要写在标题附近，不要埋在后文。
- 每个字段说明「必需 / 可选、类型、边界、失败行为」。
- 代码块给最小可复制示例，不写伪代码占位。
- 不写「未来会支持」的模糊承诺；要么进 roadmap，要么不写。
- 当前状态与兼容版本只写在 `STATUS.md`；历史版本与路线图阶段可以写，但不要另造一套「已实现」标记。

## 版本与 tag

- 本仓库的规范版本与 Sill 的版本独立；`schema` 只在破坏性变更时升。
- tag 与发布由维护者决定；PR 里不要自己改版本号或加 tag。
- `registry/catalog.json` 的 `updated` 只在条目变化时改。

## 许可

提交即同意以 MIT 许可贡献到本仓库。
