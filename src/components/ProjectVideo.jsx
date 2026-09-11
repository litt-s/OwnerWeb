// 智能视频播放器：
//   - B站视频页链接 / 嵌入链接 → B站 iframe 播放器
//   - YouTube 链接 → YouTube iframe 播放器
//   - .mp4/.webm 等直链 → <video> 播放
function toEmbed(url) {
  if (!url) return null;
  const u = String(url).trim();

  // B站：视频页链接 https://www.bilibili.com/video/BVxxxx
  let m = u.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i);
  if (m) {
    return {
      type: 'iframe',
      src: `https://player.bilibili.com/player.html?bvid=${m[1]}&page=1&high_quality=1&danmaku=0&autoplay=0`,
    };
  }
  // B站：已是嵌入链接
  m = u.match(/player\.bilibili\.com\/player\.html/i);
  if (m) {
    return { type: 'iframe', src: u.startsWith('//') ? `https:${u}` : u };
  }
  // YouTube
  m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([0-9A-Za-z_-]{6,})/i);
  if (m) {
    return { type: 'iframe', src: `https://www.youtube.com/embed/${m[1]}` };
  }
  // 直链视频文件
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(u)) {
    return { type: 'video', src: u };
  }
  // 兜底：按直链视频处理
  return { type: 'video', src: u };
}

export default function ProjectVideo({ src, poster, className = '' }) {
  const embed = toEmbed(src);
  if (!embed) return null;

  if (embed.type === 'iframe') {
    return (
      <iframe
        className={`project-video-embed ${className}`.trim()}
        src={embed.src}
        title="项目演示视频"
        scrolling="no"
        frameBorder="0"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className={`project-video-file ${className}`.trim()}
      src={embed.src}
      poster={poster || undefined}
      controls
      preload="metadata"
    />
  );
}
