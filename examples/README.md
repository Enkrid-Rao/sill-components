# Examples

| 示例 | 类型 | 说明 |
|---|---|---|
| [clock](clock) | declarative | 时间 + 日期 + 本地化标签，最小 IR |
| [counter](counter) | script | 持久化计数器，验收 sandbox / storage |

两个示例都以「引擎落地后可直接加载」为目标，不是当前可运行的 Sill 组件。
现在能用它们做的，是跑 `python scripts/validate.py` 检查契约。
