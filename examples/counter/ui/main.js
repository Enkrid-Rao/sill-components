// Sill script component — target v1 API.
// 这不是直接跑在 renderer 里的代码，而是在 sandbox iframe 内运行。
// 不能 require、不能直接用 fetch、不能访问宿主 DOM。

export default {
  async mount(ctx) {
    ctx.root.innerHTML = `
      <style>
        html, body { height: 100%; margin: 0; }
        .wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          height: 100%;
          padding: 10px 12px;
          box-sizing: border-box;
          color: ${ctx.theme.ink};
          font-family: ${ctx.theme.font.sans};
        }
        .count {
          font-family: ${ctx.theme.font.serif};
          font-size: 42px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        button {
          height: 28px;
          padding: 0 12px;
          border: 1px solid ${ctx.theme.accent};
          border-radius: 8px;
          background: transparent;
          color: ${ctx.theme.accentPale};
          font: inherit;
          cursor: pointer;
        }
      </style>
      <div class="wrap">
        <span class="count">0</span>
        <button type="button">+1</button>
      </div>
    `

    const count = ctx.root.querySelector('.count')
    const button = ctx.root.querySelector('button')
    let value = (await ctx.storage.get('count')) ?? 0
    count.textContent = String(value)

    button.addEventListener('click', async () => {
      value += 1
      count.textContent = String(value)
      await ctx.storage.set('count', value)
    })
  },

  update(ctx) {
    // 主题/语言变化时，sandbox 会整页重载；这里保留给瞬时数据的局部更新。
  },

  hide() {
    // 停止动画/计时器
  },

  dispose() {
    // 清理监听器/动画帧
  }
}
