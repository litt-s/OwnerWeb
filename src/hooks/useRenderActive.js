import { useEffect, useRef, useState } from 'react';

// 是否为移动端/触摸设备：用于降低 WebGL 渲染开销
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820;
  } catch {
    return false;
  }
}

// 元素离开视口或页面切到后台时返回 false，用于暂停 WebGL 渲染（frameloop）
export function useRenderActive() {
  const ref = useRef(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let onscreen = true;
    let visible = !document.hidden;
    const sync = () => setActive(onscreen && visible);

    const io = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    io.observe(el);

    const onVisibility = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return [ref, active];
}
