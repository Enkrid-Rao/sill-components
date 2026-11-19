# Contributing

这个仓库放**模板组件的规范、官方目录、文档和示例**；宿主实现（窗口、provider、模板引擎、安装器）在
[Sill 主仓库](https://github.com/Enkrid-Rao/sill)。

## 可以提什么

- 规范歧义、字段缺口、示例错误
- 新的 template 示例
- 绑定、增量更新、布局适配的改进
- 官方目录条目的补充：来源、权限、尺寸、失败表现
- 文档排版、中文翻译、错别字

## 不要提什么

- 在模板里依赖 `<script>`（宿主不执行它，需要 JS 就用 `type: "web"`）
- 在模板里铺整张卡片的背景（玻璃由 `.card` 提供）
- 绕过权限模型的“便利接口”
- 把旧 `declarative` / `script` 的 IR 写回来
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
4. 如果改了模板绑定 / 指令，同时更新：
   - `docs/template.md`
   - `docs/runtime.md`
   - `scripts/validate.py`
   - `spec/fixtures/template/valid` 与 `invalid`
5. 如果改了 provider，同时更新：
   - `spec/providers.json`
   - `docs/providers.md`
   - 用到它的示例
6. 如果加了官方目录条目，更新 `registry/catalog.json`，并确保 `docs` 路径存在。

## 本地校验

```bash
python scripts/validate.py            # 全仓库
python scripts/validate.py ./my-widget  # 单个组件
```

它会：

- 解析仓库内的 JSON；
- 用 Draft 2020-12 + format checker 校验 manifest / catalog；
- 检查 examples 的 `widget.json`、`ui/index.html`、`ui/style.css`、绑定、权限、大小；
- 检查绑定路径与 provider 字段；
- 跑 `spec/fixtures/*/valid` 与 `invalid` 的正反用例；
- 检查 `registry/catalog.json` 的 id 唯一性与 `docs` 文件存在；
- 检查 Markdown 相对链接。

## Fixtures

- `spec/fixtures/manifest/valid|invalid`：schema 正反用例；
- `spec/fixtures/catalog/valid|invalid`：目录 schema 正反用例；
- `spec/fixtures/template/valid|invalid`：绑定与标签自由度的正反用例。

新增规则时先加 fixture，再改 schema / 校验器 / 文档。

## 官方目录

`registry/catalog.json` 的条目不是组件包。加条目前先确认：

- 组件有 `widget.json`（如果它已经是 `.sill` 包）；
- 权限是实际使用的最小集；
- `docs` 指向本仓库内的说明页；
- `installable` 与事实一致：没有目录下载通道时必须为 `false`。
- 本地 `.sill` 安装不代表目录可下载；两个状态分开写。

内置组件的 `source.ref` 指向 Sill 的发布标签；不要指向 `main`。

## 文档风格

- 中文为主，术语保留英文（manifest / template / provider / Shadow DOM）。
- 先写范围，再写字段；「模板不执行 `<script>`」这类边界要写在标题附近。
- 每个字段说明「必需 / 可选、类型、边界、失败行为」。
- 代码块给最小可复制示例，不写伪代码占位。
- 状态与兼容版本只写在 `STATUS.md`。

## 版本与 tag

- 本仓库的规范版本与 Sill 的版本独立；`schema` 只在破坏性变更时升。
- tag 与发布由维护者决定；PR 里不要自己改版本号或加 tag。

## 许可

提交即同意以 MIT 许可贡献到本仓库。
