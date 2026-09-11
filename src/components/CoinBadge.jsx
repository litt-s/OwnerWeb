import { useEffect, useRef } from 'react';

const SLOW_SPEED = 66; // 悬停时每秒旋转角度
const SPIN_TURNS = 2; // 点击时在回正基础上额外旋转圈数
const SPIN_MS = 1500;
const SETTLE_MS = 600;
const DRAG_FACTOR = 0.6; // 拖动时每像素对应的旋转角度
const TILT_X = (7 * Math.PI) / 180; // 硬币俯仰角
// 固定光源位于左上前方：H 为「光线方向 + 视线方向」的归一化半程向量
const HALF = { x: -0.301, y: -0.274, z: 0.914 };

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutQuint = (t) => 1 - (1 - t) ** 5;

export default function CoinBadge({ regionRef }) {
  const coinRef = useRef(null);
  const glareRef = useRef(null);
  const specRef = useRef(null);
  const rimRef = useRef(null);
  const anim = useRef({
    mode: 'idle',
    angle: 0,
    from: 0,
    target: 0,
    start: 0,
    last: 0,
    raf: 0,
    hovering: false,
    direction: 1,
    dragging: false,
    dragStartX: 0,
    dragStartAngle: 0,
    moved: false,
  });

  useEffect(() => () => cancelAnimationFrame(anim.current.raf), []);

  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const render = () => {
    const a = anim.current;
    if (coinRef.current) coinRef.current.style.transform = `rotateY(${a.angle}deg)`;

    const rad = (a.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // 当前可见面的法线（含硬币俯仰角），朝向背面时取反
    let nx = sin;
    let ny = -cos * Math.sin(TILT_X);
    let nz = cos * Math.cos(TILT_X);
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const spec = Math.max(0, nx * HALF.x + ny * HALF.y + nz * HALF.z);
    const specPow = spec ** 5;
    const fresnel = (1 - Math.abs(cos)) ** 3;

    // 高光跟随硬币轮廓做横向压缩，光源方向保持固定
    if (glareRef.current) {
      glareRef.current.style.transform = `scaleX(${Math.abs(cos).toFixed(4)})`;
    }
    if (specRef.current) {
      specRef.current.style.opacity = (0.1 + 0.9 * specPow).toFixed(3);
      specRef.current.style.transform = `translate3d(${(-sin * 12).toFixed(2)}%, ${(sin * 5).toFixed(2)}%, 0)`;
    }
    if (rimRef.current) {
      rimRef.current.style.opacity = (0.85 * fresnel).toFixed(3);
    }
  };

  const tick = (now) => {
    const a = anim.current;
    const dt = a.last ? Math.min(64, now - a.last) : 16;
    a.last = now;

    if (a.mode === 'hover') {
      a.angle += SLOW_SPEED * a.direction * (dt / 1000);
    } else if (a.mode === 'settle') {
      const t = Math.min(1, (now - a.start) / SETTLE_MS);
      a.angle = a.from + (a.target - a.from) * easeOutCubic(t);
      if (t >= 1) {
        a.angle = a.target;
        a.mode = a.hovering ? 'hover' : 'idle';
      }
    } else if (a.mode === 'spin') {
      const t = Math.min(1, (now - a.start) / SPIN_MS);
      a.angle = a.from + (a.target - a.from) * easeOutQuint(t);
      if (t >= 1) {
        a.angle = a.target;
        a.mode = a.hovering ? 'hover' : 'idle';
      }
    }

    render();

    if (a.mode === 'idle') {
      a.raf = 0;
      return;
    }
    a.raf = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    const a = anim.current;
    if (a.raf) return;
    a.last = 0;
    a.raf = requestAnimationFrame(tick);
  };

  const stopLoop = () => {
    const a = anim.current;
    if (a.raf) cancelAnimationFrame(a.raf);
    a.raf = 0;
  };

  // 悬停区域为整块头像卡：鼠标在硬币中心左侧时向右转，右侧时向左转
  useEffect(() => {
    const region = regionRef?.current;
    if (!region) return undefined;
    const onMove = (e) => {
      const a = anim.current;
      if (a.dragging || prefersReduced()) return;
      const rect = region.getBoundingClientRect();
      a.direction = e.clientX < rect.left + rect.width / 2 ? 1 : -1;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      region.style.setProperty('--par-x', nx.toFixed(3));
      region.style.setProperty('--par-y', ny.toFixed(3));
      a.hovering = true;
      if (a.mode === 'idle') {
        a.mode = 'hover';
        startLoop();
      }
    };
    const onLeave = () => {
      const a = anim.current;
      a.hovering = false;
      region.style.setProperty('--par-x', '0');
      region.style.setProperty('--par-y', '0');
      if (a.mode === 'hover') {
        a.mode = 'settle';
        a.from = a.angle;
        a.target = Math.round(a.angle / 360) * 360;
        a.start = performance.now();
      }
    };
    region.addEventListener('mousemove', onMove);
    region.addEventListener('mouseleave', onLeave);
    return () => {
      region.removeEventListener('mousemove', onMove);
      region.removeEventListener('mouseleave', onLeave);
    };
  }, [regionRef]);

  const handlePointerDown = (e) => {
    const a = anim.current;
    stopLoop();
    a.dragging = true;
    a.moved = false;
    a.dragStartX = e.clientX;
    a.dragStartAngle = a.angle;
    a.mode = 'drag';
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 指针捕获失败不影响拖动 */
      }
    }
  };

  const handlePointerMove = (e) => {
    const a = anim.current;
    if (!a.dragging) return;
    const dx = e.clientX - a.dragStartX;
    if (Math.abs(dx) > 4) a.moved = true;
    a.angle = a.dragStartAngle + dx * DRAG_FACTOR;
    render();
  };

  const handlePointerEnd = (e) => {
    const a = anim.current;
    if (!a.dragging) return;
    a.dragging = false;
    if (e.currentTarget.releasePointerCapture && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* 忽略释放失败 */
      }
    }
    a.target = Math.round(a.angle / 360) * 360;
    if (prefersReduced()) {
      a.angle = a.target;
      a.mode = 'idle';
      render();
      return;
    }
    a.mode = 'settle';
    a.from = a.angle;
    a.start = performance.now();
    startLoop();
  };

  const handleClick = () => {
    const a = anim.current;
    if (a.moved) {
      a.moved = false;
      return;
    }
    if (prefersReduced()) return;
    a.mode = 'spin';
    a.from = a.angle;
    a.target = (Math.floor(a.angle / 360) + 1 + SPIN_TURNS) * 360;
    a.start = performance.now();
    startLoop();
  };

  return (
    <button
      type="button"
      className="portrait-badge"
      aria-label="LH 徽章，可拖动旋转，点击快速旋转"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleClick}
    >
      <span className="portrait-badge-coin" ref={coinRef} aria-hidden="true">
        <span className="coin-face coin-front">
          <svg viewBox="0 0 424 424" focusable="false">
            <defs>
              <linearGradient id="badgeRingFront" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff3b30" />
                <stop offset="1" stopColor="#a8231d" />
              </linearGradient>
            </defs>
            <circle cx="212" cy="212" r="210" fill="none" stroke="url(#badgeRingFront)" strokeWidth="1.5" opacity="0.7" />
            <circle cx="212" cy="212" r="178" fill="#101010" stroke="#242424" strokeWidth="1.5" />
            <text x="212" y="212" fill="#ffffff" fontFamily="'JetBrains Mono', monospace" fontSize="120" fontWeight="600" textAnchor="middle" dominantBaseline="central">LH</text>
            <text x="212" y="290" fill="#6a6a6a" fontFamily="'JetBrains Mono', monospace" fontSize="20" letterSpacing="6" textAnchor="middle">LI HAORAN</text>
          </svg>
          <span className="coin-orbit">
            <span className="coin-orbit-arm">
              <span className="coin-orbit-item">
                <i className="coin-status-dot" />
                <span className="coin-status-label">ONLINE</span>
              </span>
            </span>
          </span>
        </span>
        <span className="coin-face coin-back">
          <svg viewBox="0 0 424 424" focusable="false">
            <defs>
              <linearGradient id="badgeRingBack" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff3b30" />
                <stop offset="1" stopColor="#a8231d" />
              </linearGradient>
            </defs>
            <circle cx="212" cy="212" r="210" fill="none" stroke="url(#badgeRingBack)" strokeWidth="1.5" opacity="0.7" />
            <circle cx="212" cy="212" r="178" fill="#101010" stroke="#242424" strokeWidth="1.5" />
            <circle cx="212" cy="212" r="30" fill="#ff3b30" opacity="0.16" />
            <rect x="152" y="152" width="120" height="120" rx="18" fill="none" stroke="#f5f5f7" strokeWidth="8" />
            <g stroke="#f5f5f7" strokeWidth="7" strokeLinecap="round" fill="none">
              <path d="M172 136v16M212 136v16M252 136v16" />
              <path d="M172 272v16M212 272v16M252 272v16" />
              <path d="M136 172h16M136 212h16M136 252h16" />
              <path d="M272 172h16M272 212h16M272 252h16" />
            </g>
            <circle cx="212" cy="212" r="12" fill="#ff3b30" />
          </svg>
        </span>
      </span>
      <span className="coin-glare" ref={glareRef} aria-hidden="true">
        <span className="coin-spec" ref={specRef} />
        <span className="coin-rim" ref={rimRef} />
      </span>
    </button>
  );
}
