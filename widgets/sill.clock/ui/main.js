// 独立时钟卡：只负责 HH:MM + 秒 + 时段。
const pad = (value) => String(value).padStart(2, '0')

sill.onData(({ data, language }) => {
  const iso = data.time?.iso
  if (!iso) return
  const date = new Date(iso)
  const time = root.getElementById('time')
  const seconds = root.getElementById('seconds')
  const daypart = root.getElementById('daypart')
  if (time) time.textContent = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (seconds) seconds.textContent = pad(date.getSeconds())
  if (daypart) {
    const hour = date.getHours()
    const zh = language !== 'en'
    daypart.textContent =
      hour < 6
        ? zh
          ? '凌晨'
          : 'Late night'
        : hour < 12
          ? zh
            ? '上午'
            : 'Morning'
          : hour < 18
            ? zh
              ? '下午'
              : 'Afternoon'
            : zh
              ? '晚上'
              : 'Evening'
  }
})
