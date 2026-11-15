# Contributing

这个仓库只放**组件契约、文档和示例**；宿主实现（窗口、provider、IR 引擎、沙箱）在
[Sill 主仓库](https://github.com/Enkrid-Rao/sill)。

## 可以提什么

- 规范歧义、字段缺口、示例错误
- 新的声明式组件示例（不要求能在 0.4 直接运行）
- 安全边界 / 权限模型的改进
- 文档排版、中文翻译

## 不要提什么

- 在示例里加 Node / Electron API
- 绕过权限模型的“便利接口”
- 依赖未声明网络的组件
- 直接修改 `schema: 1` 的语义；破坏性变更请先开 issue 讨论升版

## 修改流程

1. 改文档或示例。
2. 跑 JSON 解析与 schema 校验（见下）。
3. 如果改了 manifest 字段，同时更新：
   - `docs/manifest.md`
   - `spec/widget.schema.json`
   - 至少一个 example
4. 如果改了 IR 节点，同时更新：
   - `docs/ir.md`
   - `docs/testing.md` 的验收项
   - 一个最小示例
5. 提交前确认没有把“计划中”写成“已实现”。

## 本地校验

```bash
# JSON 可解析
find . -name '*.json' -print0 | xargs -0 -n1 python -m json.tool > /dev/null

# manifest 对 schema（需要 python jsonschema）
python - <<'PY'
import json, jsonschema, pathlib
root = pathlib.Path('.')
schema = json.loads((root / 'spec/widget.schema.json').read_text())
for p in root.glob('examples/*/widget.json'):
    jsonschema.validate(json.loads(p.read_text()), schema)
    print('ok', p)
PY
```

Windows PowerShell 可以用 `python -m json.tool <file>` 逐个检查。

## 文档风格

- 中文为主，术语保留英文（manifest / IR / provider / sandbox）。
- 先写“当前状态”，再写目标 API；不把规划写成已交付。
- 代码块给最小可复制示例，不写伪代码占位。
- 每个字段说明“必需/可选、类型、边界、失败行为”。

## 许可

提交即同意以 MIT 许可贡献到本仓库。
