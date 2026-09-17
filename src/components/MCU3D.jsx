import { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { isMobileDevice, useRenderActive } from '../hooks/useRenderActive';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const HOTSPOTS = {
  chip: { index: '01', label: '精选项目', to: '/', anchor: '#projects' },
  headers: { index: '02', label: '个人经历', to: '/', anchor: '#experience' },
  crystal: { index: '03', label: '个人优势', to: '/', anchor: '#strengths' },
  usb: { index: '04', label: '联系我', to: '/', anchor: '#contact' },
  buzzer: { index: '05', label: '访客留言', to: '/comments' },
};

const CHIP_X = -2.6;
const CHIP_HALF = 1.0;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLabel(text) {
  return makeTexture(512, 128, (ctx) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 76px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
  });
}

/* 板面：铜箔铺层 + 走线 + 过孔 + 焊盘 + 丝印位号 + 板名 */
function drawBoard(ctx) {
  const W = 1024;
  const H = 560;
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,59,48,0.06)';
  roundRect(ctx, 40, 40, W - 80, H - 80, 18);
  ctx.fill();

  const trace = (pts, w = 4) => {
    ctx.strokeStyle = 'rgba(255,59,48,0.5)';
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  };
  const via = (x, y, r = 7) => {
    ctx.fillStyle = 'rgba(255,59,48,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };
  const pad = (x, y, w = 24, h = 14) => {
    ctx.fillStyle = '#cfcfcf';
    roundRect(ctx, x - w / 2, y - h / 2, w, h, 3);
    ctx.fill();
  };

  trace([[80, 80], [160, 80], [160, 180], [300, 180]]);
  trace([[80, 260], [240, 260], [240, 380], [420, 380]]);
  trace([[520, 90], [640, 90], [640, 220]]);
  trace([[700, 180], [820, 180], [820, 300], [940, 300]]);
  trace([[760, 90], [940, 90], [940, 170]]);
  trace([[520, 360], [660, 360], [660, 470], [820, 470]]);
  trace([[300, 470], [300, 380], [430, 380]]);
  trace([[160, 300], [300, 300], [300, 240]]);
  trace([[900, 220], [760, 220]]);
  trace([[640, 470], [640, 400]]);

  [
    [160, 180], [300, 180], [240, 260], [240, 380], [640, 90], [640, 220],
    [820, 300], [940, 90], [660, 360], [820, 470], [430, 380], [160, 300],
    [900, 220], [640, 470],
  ].forEach((p) => via(p[0], p[1]));

  [
    [120, 300], [150, 300], [520, 140], [550, 140], [600, 140], [900, 220],
    [930, 220], [360, 430], [390, 430], [86, 90],
  ].forEach((p) => pad(p[0], p[1]));

  ctx.fillStyle = '#e9e9e9';
  ctx.font = '700 28px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < 18; i++) {
    const x = 78 + i * 51;
    ctx.fillText(String(i + 1), x, 46);
    ctx.fillText(String(i + 1), x, H - 20);
  }

  ctx.font = '700 30px monospace';
  ctx.fillText('PWR', 84, 104);
  ctx.fillText('BOOT0', 84, H - 86);
  ctx.fillText('VCC', 936, 104);
  ctx.fillText('GND', 936, H - 86);

  ctx.font = '600 22px monospace';
  ctx.fillStyle = '#d8d8d8';
  ctx.fillText('R1', 116, 292, 40);
  ctx.fillText('C1', 536, 130, 40);
  ctx.fillText('U2', 700, 172, 40);
  ctx.fillText('Y1', 790, 266, 40);
  ctx.fillText('C2', 906, 206, 40);
  ctx.fillText('R2', 352, 420, 40);
  ctx.fillText('D1', 132, 76, 40);
  ctx.fillText('SWD', 620, 470, 40);

  ctx.fillStyle = '#ff3b30';
  ctx.font = '700 46px monospace';
  ctx.fillText('F103', 512, 296);
  ctx.fillStyle = '#e9e9e9';
  ctx.font = '500 22px monospace';
  ctx.fillText('MINI SYSTEM BOARD', 512, 334);
}

/* 芯片盖面：封装激边 + 裸片 + 位号 + 定向标记 */
function drawChip(ctx) {
  const W = 512;
  const H = 512;
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.fillStyle = '#0c0c0c';
  roundRect(ctx, 148, 148, 216, 216, 14);
  ctx.fill();
  ctx.strokeStyle = '#2f2f2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(148, 148, 216, 216);

  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.arc(78, 436, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '700 26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1', 78, 470);

  ctx.fillStyle = '#f5f5f7';
  ctx.font = '700 76px monospace';
  ctx.fillText('STM32', W / 2, 214);
  ctx.font = '500 60px monospace';
  ctx.fillText('F103C8T6', W / 2, 302);

  ctx.fillStyle = '#5a5a5a';
  ctx.beginPath();
  ctx.moveTo(140, 434);
  ctx.lineTo(162, 434);
  ctx.lineTo(151, 456);
  ctx.closePath();
  ctx.fill();
}

// 相机按容器宽高比自适应：窄屏拉远，保证 PCB 两端完整入画
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = (camera.fov * Math.PI) / 180;
    // 取景宽度要留出余量：拖动旋转时两侧标注会向外摆，太窄会被画布边缘裁掉
    const targetWidth = aspect < 1.3 ? 15 : 27;
    const z = targetWidth / (2 * Math.tan(fov / 2) * aspect);
    camera.position.z = Math.max(16, Math.min(46, z));
    camera.position.y = camera.position.z * 0.08;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function McuModel({ dragRef, onHover, goTo }) {
  const { size } = useThree();
  const narrow = size.width / Math.max(1, size.height) < 1.3;
  const modelRef = useRef();
  const floatRef = useRef();
  const blinkMat = useRef();
  const statusMat = useRef();
  const first = useRef(true);
  const startT = useRef(0);
  const hoverRef = useRef(null);

  const chipRef = useRef();
  const headersRef = useRef();
  const crystalRef = useRef();
  const usbRef = useRef();
  const buzzerRef = useRef();
  const guideRef = useRef();
  const calloutRef = useRef();

  const tex = useMemo(
    () => ({
      board: makeTexture(1024, 560, drawBoard),
      chip: makeTexture(512, 512, drawChip),
      glow: makeTexture(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
        g.addColorStop(0, 'rgba(255,59,48,0.5)');
        g.addColorStop(1, 'rgba(255,59,48,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }),
    guide: makeTexture(256, 256, (ctx) => {
        ctx.clearRect(0, 0, 256, 256);
        ctx.setLineDash([11, 8]);
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        roundRect(ctx, 16, 16, 224, 224, 24);
        ctx.stroke();
      }),
    guideSharp: makeTexture(256, 256, (ctx) => {
        ctx.clearRect(0, 0, 256, 256);
        ctx.setLineDash([13, 7]);
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 236, 236);
      }),
    labels: {
        projects: makeLabel('精选项目'),
        experience: makeLabel('个人经历'),
        strengths: makeLabel('个人优势'),
        contact: makeLabel('联系我'),
        comments: makeLabel('访客留言'),
      },
    }),
    []
  );

  const pins = useMemo(() => {
    const perSide = 12;
    const spacing = 0.16;
    const start = -((perSide - 1) * spacing) / 2;
    const off = CHIP_HALF + 0.12;
    const out = [];
    for (let i = 0; i < perSide; i++) {
      const o = start + i * spacing;
      out.push({ pos: [CHIP_X + o, 0.3, off], rot: [0, 0, 0] });
      out.push({ pos: [CHIP_X + o, 0.3, -off], rot: [0, Math.PI, 0] });
      out.push({ pos: [CHIP_X - off, 0.3, o], rot: [0, Math.PI / 2, 0] });
      out.push({ pos: [CHIP_X + off, 0.3, o], rot: [0, -Math.PI / 2, 0] });
    }
    return out;
  }, []);

  const headers = useMemo(() => {
    const out = [];
    for (let i = 0; i < 18; i++) {
      const x = -5.1 + i * 0.6;
      out.push({ pos: [x, 0.42, 2.72] });
      out.push({ pos: [x, 0.42, -2.72] });
    }
    return out;
  }, []);

  const smd = useMemo(
    () => [
      { pos: [-1.5, 0.29, 2.0], size: [0.34, 0.18, 0.5] },
      { pos: [-0.9, 0.29, 2.0], size: [0.34, 0.18, 0.5] },
      { pos: [0.4, 0.29, 1.8], size: [0.5, 0.22, 0.34] },
      // 远离电解电容 (4.7, 0.4)，避免嵌进电容圆柱
      { pos: [4.6, 0.29, 1.4], size: [0.3, 0.16, 0.44] },
      { pos: [1.6, 0.29, 2.0], size: [0.34, 0.18, 0.5] },
    ],
    []
  );

  const mounting = useMemo(
    () => [
      [-5.5, 2.6],
      [-5.5, -2.6],
      [5.5, 2.6],
      [5.5, -2.6],
    ],
    []
  );

  const lineBetween = (x0, z0, x1, z1, y) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const total = Math.hypot(dx, dz);
    const ux = dx / total;
    const uz = dz / total;
    const cut = 0.12;
    const ex = x1 - ux * cut;
    const ez = z1 - uz * cut;
    return {
      start: [x0, z0],
      end: [x1, z1],
      mid: [(x0 + ex) / 2, y, (z0 + ez) / 2],
      angle: Math.atan2(dx, dz),
      len: total - cut,
      y,
    };
  };

  // lx/lz 为标签中心；把标签放在线段末端圆圈之外，避免与圆圈重叠
  const callouts = [
    { label: tex.labels.projects, lx: -10.3, lz: 0, line: lineBetween(-4.55, 0, -8.6, 0, 1.122) },
    { label: tex.labels.experience, lx: 0, lz: -5.5, line: lineBetween(0, -3.498, 0, -4.7, 1.232) },
    { label: tex.labels.strengths, lx: 10.3, lz: -1.3, line: lineBetween(4.978, -1.3, 8.6, -1.3, 1.045) },
    { label: tex.labels.contact, lx: 10.3, lz: 2.0, line: lineBetween(6.628, 2.15, 8.6, 2.0, 1.155) },
    { label: tex.labels.comments, lx: -10.3, lz: 1.6, line: lineBetween(-5.775, 1.6, -8.6, 1.6, 1.155) },
  ];

  const bind = (key) => ({
    onClick: (e) => {
      e.stopPropagation();
      goTo(HOTSPOTS[key]);
    },
    onPointerOver: (e) => {
      e.stopPropagation();
      hoverRef.current = key;
      onHover({ ...HOTSPOTS[key] });
    },
    onPointerOut: () => {
      hoverRef.current = null;
      onHover(null);
    },
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (first.current) {
      first.current = false;
      startT.current = t;
    }

    const d = dragRef.current;
    const model = modelRef.current;
    const float = floatRef.current;
    const showFrontAnnotations = Math.cos(d.rotY) > 0.15;
    if (guideRef.current) guideRef.current.visible = showFrontAnnotations;
    if (calloutRef.current) calloutRef.current.visible = showFrontAnnotations;

    if (model) {
      if (!d.dragging) {
        d.rotX = lerp(d.rotX, Math.sin(t * 0.6) * 0.05, 0.02);
        d.rotY = lerp(d.rotY, Math.sin(t * 0.3) * 0.1, 0.02);
      }
      model.rotation.y = d.rotY;
      model.rotation.x = d.rotX;
      const el = clamp((t - startT.current) / 1.7, 0, 1);
      model.position.y = (1 - easeOutBack(el)) * -14 - 0.5;
    }

    if (float) float.position.y = Math.sin(t * 0.8) * 0.12;
    if (blinkMat.current) blinkMat.current.emissiveIntensity = Math.sin(t * 5) > 0.4 ? 2.4 : 0.05;
    if (statusMat.current) statusMat.current.emissiveIntensity = 0.8 + (Math.sin(t * 2) * 0.5 + 0.5) * 2;

    const hover = hoverRef.current;
    for (const [key, ref] of [
      ['chip', chipRef],
      ['headers', headersRef],
      ['crystal', crystalRef],
      ['usb', usbRef],
      ['buzzer', buzzerRef],
    ]) {
      const g = ref.current;
      if (!g) continue;
      const want = hover === key ? 1.06 : 1;
      g.scale.x += (want - g.scale.x) * 0.12;
      g.scale.y += (want - g.scale.y) * 0.12;
      g.scale.z += (want - g.scale.z) * 0.12;
    }
  });

  return (
    <group ref={modelRef} position={[0, -0.5, 0]}>
      <group ref={floatRef}>
        {/* stood-up board, leaning back toward viewer */}
        <group ref={calloutRef} rotation={[Math.PI / 2 - 0.34, 0, 0]}>
          <group scale={1.1}>
          {/* PCB base */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[11.6, 0.38, 6.0]} />
            <meshStandardMaterial color="#0d0d0d" metalness={0.4} roughness={0.6} />
          </mesh>
          {/* silk-screen face */}
          <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[11.6, 6.0]} />
            <meshStandardMaterial map={tex.board} color="#ffffff" metalness={0.3} roughness={0.6} />
          </mesh>

          {/* mounting holes */}
          {mounting.map((m, i) => (
            <mesh key={i} position={[m[0], 0.22, m[1]]}>
              <cylinderGeometry args={[0.42, 0.42, 0.06, 24]} />
              <meshStandardMaterial color="#030303" metalness={0.4} roughness={0.7} />
            </mesh>
          ))}

          {/* MCU cluster */}
          <group ref={chipRef} {...bind('chip')}>
            <mesh position={[CHIP_X, 0.425, 0]}>
              <boxGeometry args={[CHIP_HALF * 2, 0.45, CHIP_HALF * 2]} />
              <meshStandardMaterial color="#151515" metalness={0.72} roughness={0.3} />
            </mesh>
            <mesh position={[CHIP_X, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[CHIP_HALF * 2, CHIP_HALF * 2]} />
              <meshStandardMaterial map={tex.chip} color="#ffffff" metalness={0.55} roughness={0.32} />
            </mesh>
            <mesh position={[CHIP_X - 1.1, 0.7, -1.1]}>
              <boxGeometry args={[0.14, 0.04, 0.14]} />
              <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={1} />
            </mesh>
            {pins.map((p, i) => (
              <mesh key={i} position={p.pos} rotation={p.rot}>
                <boxGeometry args={[0.07, 0.07, 0.26]} />
                <meshStandardMaterial color="#d6d6d6" metalness={0.92} roughness={0.26} />
              </mesh>
            ))}
          </group>

          {/* header sockets (base strip + pins) */}
          <group ref={headersRef} {...bind('headers')}>
            <mesh position={[0, 0.3, 2.72]}>
              <boxGeometry args={[10.8, 0.2, 0.3]} />
              <meshStandardMaterial color="#1c1c1c" metalness={0.6} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.3, -2.72]}>
              <boxGeometry args={[10.8, 0.2, 0.3]} />
              <meshStandardMaterial color="#1c1c1c" metalness={0.6} roughness={0.5} />
            </mesh>
            {headers.map((h, i) => (
              <mesh key={i} position={h.pos}>
                <cylinderGeometry args={[0.08, 0.08, 1.1, 10]} />
                <meshStandardMaterial color="#d6d6d6" metalness={0.9} roughness={0.3} />
              </mesh>
            ))}
          </group>

          {/* crystal cluster */}
          <group ref={crystalRef} {...bind('crystal')}>
            <mesh position={[3.9, 0.45, -1.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.5, 20]} />
              <meshStandardMaterial color="#c4c4c4" metalness={0.95} roughness={0.2} />
            </mesh>
            <mesh position={[3.9, 0.36, -1.3]}>
              <boxGeometry args={[0.9, 0.14, 0.7]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>

          {/* reset button */}
          <mesh position={[4.2, 0.4, 1.4]}>
            <boxGeometry args={[0.9, 0.4, 0.9]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[4.2, 0.68, 1.4]}>
            <boxGeometry args={[0.5, 0.22, 0.5]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.5} />
          </mesh>

          {/* USB connector cluster */}
          <group ref={usbRef} {...bind('usb')}>
            <mesh position={[5.45, 0.4, 2.15]}>
              <boxGeometry args={[0.5, 0.7, 1.5]} />
              <meshStandardMaterial color="#232323" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[5.62, 0.52, 2.15]}>
              <boxGeometry args={[0.16, 0.5, 1.1]} />
              <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>

          {/* buzzer cluster */}
          <group ref={buzzerRef} {...bind('buzzer')}>
            <mesh position={[-4.6, 0.5, 1.6]}>
              <cylinderGeometry args={[0.5, 0.5, 0.34, 24]} />
              <meshStandardMaterial color="#3a3a40" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[-4.6, 0.7, 1.6]}>
              <cylinderGeometry args={[0.42, 0.42, 0.06, 24]} />
              <meshStandardMaterial color="#b8b8c0" metalness={0.92} roughness={0.28} />
            </mesh>
            <mesh position={[-4.6, 0.74, 1.6]}>
              <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
              <meshStandardMaterial color="#1c1c1e" roughness={0.7} />
            </mesh>
            <mesh position={[-4.6, 0.77, 1.6]}>
              <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
              <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={0.6} roughness={0.4} />
            </mesh>
          </group>

          {/* voltage regulator (SOP-8) */}
          <mesh position={[0.6, 0.32, -1.7]}>
            <boxGeometry args={[1.5, 0.24, 1.8]} />
            <meshStandardMaterial color="#171717" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.05, 0.2, -1.7]}>
            <boxGeometry args={[0.5, 0.16, 1.2]} />
            <meshStandardMaterial color="#d6d6d6" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[1.15, 0.2, -1.7]}>
            <boxGeometry args={[0.5, 0.16, 1.2]} />
            <meshStandardMaterial color="#d6d6d6" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* electrolytic capacitor */}
          <mesh position={[4.7, 0.55, 0.4]}>
            <cylinderGeometry args={[0.42, 0.42, 0.7, 24]} />
            <meshStandardMaterial color="#1b1b1b" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[4.7, 0.94, 0.4]}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 24]} />
            <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* SMD resistors / caps */}
          {smd.map((s, i) => (
            <group key={i} position={s.pos}>
              <mesh>
                <boxGeometry args={s.size} />
                <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.55} />
              </mesh>
              <mesh position={[s.size[0] / 2 + 0.05, 0, 0]}>
                <boxGeometry args={[0.14, s.size[1] + 0.02, s.size[2] + 0.02]} />
                <meshStandardMaterial color="#cfcfcf" metalness={0.9} roughness={0.3} />
              </mesh>
              <mesh position={[-s.size[0] / 2 - 0.05, 0, 0]}>
                <boxGeometry args={[0.14, s.size[1] + 0.02, s.size[2] + 0.02]} />
                <meshStandardMaterial color="#cfcfcf" metalness={0.9} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* LEDs */}
          <mesh position={[-4.9, 0.36, -2.3]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial ref={blinkMat} color="#1c0505" emissive="#ff3b30" emissiveIntensity={0.1} roughness={0.4} />
          </mesh>
          <mesh position={[2.0, 0.32, -2.55]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial ref={statusMat} color="#1c0505" emissive="#ff3b30" emissiveIntensity={1} roughness={0.4} />
          </mesh>

          {/* raised copper traces */}
          <mesh position={[-1.8, 0.2, 0.9]}>
            <boxGeometry args={[3.4, 0.04, 0.14]} />
            <meshStandardMaterial color="#40120d" emissive="#ff3b30" emissiveIntensity={0.8} roughness={0.5} />
          </mesh>
          <mesh position={[1.4, 0.2, -0.6]}>
            <boxGeometry args={[0.14, 0.04, 2.4]} />
            <meshStandardMaterial color="#40120d" emissive="#ff3b30" emissiveIntensity={0.8} roughness={0.5} />
          </mesh>

          {/* persistent white guide outlines (clickable regions) */}
          <group ref={guideRef}>
          {[
            { x: CHIP_X, y: 1.02, z: 0, w: 3.3, h: 3.3, sharp: false },
            { x: 0, y: 1.12, z: 2.72, w: 10.8, h: 0.92, sharp: true },
            { x: 0, y: 1.12, z: -2.72, w: 10.8, h: 0.92, sharp: true },
            { x: 3.9, y: 0.95, z: -1.3, w: 1.25, h: 1.25, sharp: false },
            { x: 5.45, y: 1.05, z: 2.15, w: 1.15, h: 1.6, sharp: false },
            { x: -4.6, y: 1.05, z: 1.6, w: 1.3, h: 1.3, sharp: false },
          ].map((g, i) => (
            <mesh key={i} position={[g.x, g.y, g.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[g.w, g.h]} />
              <meshBasicMaterial map={g.sharp ? tex.guideSharp : tex.guide} transparent opacity={0.9} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
          </group>
          </group>

        </group>
        {/* front-facing floating leader lines and labels；窄屏隐藏标注避免裁切 */}
        <group rotation={[Math.PI / 2 - 0.34, 0, 0]}>
          {!narrow && callouts.map((c, ci) => (
            <group key={ci}>
              <mesh position={c.line.mid} rotation={[0, c.line.angle, 0]}>
                <boxGeometry args={[0.03, 0.02, c.line.len]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} depthTest={false} />
              </mesh>
              <mesh position={[c.line.start[0], c.line.y, c.line.start[1]]}>
                <boxGeometry args={[0.12, 0.03, 0.12]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} depthTest={false} />
              </mesh>
              <mesh position={[c.line.end[0], c.line.y, c.line.end[1]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.08, 0.13, 24]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[c.lx, c.line.y, c.lz]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.8, 0.9]} />
                <meshBasicMaterial map={c.label} transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

        </group>
      </group>
    </group>
  );
}

export default function MCU3D() {
  const navigate = useNavigate();
  const dragRef = useRef({ rotY: 0, rotX: 0, dragging: false, lastX: 0, lastY: 0 });
  const [hover, setHover] = useState(null);
  const [wrapRef, renderActive] = useRenderActive();
  const mobile = useMemo(() => isMobileDevice(), []);

  const goTo = (h) => {
    if (h.to === '/' && h.anchor) navigate('/', { state: { scrollTo: h.anchor } });
    else navigate(h.to);
  };

  const onDown = (e) => {
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.rotY += (e.clientX - d.lastX) * 0.006;
    d.rotX = clamp(d.rotX + (e.clientY - d.lastY) * 0.004, -0.6, 0.6);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
  };
  const onUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div
      ref={wrapRef}
      className="mcu-wrap"
      style={{ cursor: hover ? 'pointer' : 'grab' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <Canvas
        className="mcu-canvas"
        camera={{ position: [0, 1.5, 19.5], fov: 40 }}
        dpr={mobile ? [1, 1.5] : [1, 1.75]}
        frameloop={renderActive ? 'always' : 'never'}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
      >
        <ResponsiveCamera />
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 12, 8]} intensity={1.4} />
        <directionalLight position={[-10, 5, -8]} intensity={0.45} color="#ff8a86" />
        <pointLight position={[0, 6, 6]} intensity={6} color="#ff3b30" distance={26} decay={2} />
        <McuModel dragRef={dragRef} onHover={setHover} goTo={goTo} />
      </Canvas>
    </div>
  );
}
