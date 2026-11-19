// ui/main.js 在宿主页面里执行一次。sill 和 root 是宿主注入的参数。

let count = 0

sill.onData(({ data }) => {
  root.querySelector('#time').textContent = data.now?.time ?? '--:--'
})

// 私有存储：落在 <userData>/widget-data/com.example.inlineclock.json
sill.storage.get().then((value) => {
  count = Number(value.count) || 0
  root.querySelector('#count').textContent = String(count)
})

root.querySelector('#btn').addEventListener('click', async () => {
  count += 1
  root.querySelector('#count').textContent = String(count)
  await sill.storage.patch({ count })
})
