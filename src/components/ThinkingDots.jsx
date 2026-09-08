import { useEffect, useRef } from 'react';
import './ThinkingDots.css';

const hexToRgb = (hex) => {
  const v = hex.replace(/^#/, '');
  const n = v.length === 3 ? v.replace(/./g, (c) => c + c) : v;
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(n);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 90, 77];
};

export default function ThinkingDots({
  color = '#ff5a4d',
  colorDark = '#2a0b08',
  spacing = 15,
  size = 1.1,
  maxSize = 4.8,
  opacity = 0.9,
  baseAlpha = 0.12,
  glowRadius = 90,
  dpr = 1.5,
}) {
  const ref = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, strength: 0, inside: false });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DP = Math.min(Math.max(dpr, 0.6), 2);
    const [cr, cg, cb] = hexToRgb(color);
    const [dr, dg, db] = hexToRgb(colorDark);
    let w = 0;
    let h = 0;
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sig = glowRadius * 0.55;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * DP;
      canvas.height = h * DP;
      ctx.setTransform(DP, 0, 0, DP, 0, 0);
      if (!mouseRef.current.inside) {
        mouseRef.current.x = w / 2;
        mouseRef.current.y = h / 2;
      }
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      const inside =
        mouseRef.current.x >= 0 && mouseRef.current.x <= w && mouseRef.current.y >= 0 && mouseRef.current.y <= h;
      mouseRef.current.inside = inside;
    };
    const onLeave = () => {
      mouseRef.current.inside = false;
    };
    const onMouseOut = (e) => {
      if (!e.relatedTarget) onLeave();
    };
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);
    document.addEventListener('mouseout', onMouseOut);

    const drawFrame = (t) => {
      ctx.clearRect(0, 0, w, h);
      const m = mouseRef.current;
      m.strength += ((m.inside ? 1 : 0) - m.strength) * 0.08;
      const strength = m.strength;
      const step = spacing;
      for (let y = step; y < h; y += step) {
        for (let x = step; x < w; x += step) {
          const dx = x - m.x;
          const dy = y - m.y;
          const dist = Math.hypot(dx, dy);
          const g = Math.exp(-(dist * dist) / (2 * sig * sig));
          let b = g * strength;
          b = b > 1 ? 1 : b;
          const alpha = baseAlpha + b * opacity;
          const r = size + b * (maxSize - size);
          const rr = Math.round(dr + (cr - dr) * b);
          const gg = Math.round(dg + (cg - dg) * b);
          const bb = Math.round(db + (cb - db) * b);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
          ctx.fill();
        }
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      drawFrame(performance.now() / 1000);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (reduced.matches) drawFrame(0);
    else loop();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, [color, colorDark, spacing, size, maxSize, opacity, baseAlpha, glowRadius, dpr]);

  return (
    <div className="thinking-dots-container">
      <canvas ref={ref} className="thinking-dots-canvas" />
    </div>
  );
}
