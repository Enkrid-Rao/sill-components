# Lyrics · 歌词

显示当前播放歌曲的同步歌词。数据来自 `media.nowPlaying`，歌词来自 [LRCLIB](https://lrclib.net)
（免费、开放 CORS），不需要 API key。

## 安装

- 应用内：设置 → 组件 → 从 URL 安装，粘贴
  `https://raw.githubusercontent.com/Enkrid-Rao/sill-components/main/registry/packages/sill.lyrics-1.0.0.sill`
- 或从组件目录安装（`sill.lyrics`）
- 源码在 `widgets/sill.lyrics/`，也可以直接放进 `skins/` 开发

## 行为

- 歌曲 / 歌手变化时向 LRCLIB 搜索一次，优先同步歌词（`syncedLyrics`），否则显示无时间轴的两行；
- 播放中按 200ms 推进当前行，暂停时停住；切歌自动重新加载；
- 没在播放时显示「没有在播放」，搜不到显示「没有找到歌词」，纯音乐显示「纯音乐」；
- 设置 → 组件 → 歌词 → 歌词偏移：`-10 … +10` 秒，用于校正现场 / 蓝牙延迟。

## 隐私与限制

- 会把**歌名、歌手、专辑、时长**发给 `lrclib.net`；不接受的话不要安装。
- 只按歌名 / 歌手匹配，不读本地文件，也不读歌曲旁边 `.lrc`；
- 依赖 LRCLIB 的曲库，冷门歌可能没有歌词；
- 时间轴精度约 200ms，适合逐行歌词，不适合作逐字卡拉 OK。

