import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

function makeFaceTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(512, 420, 40, 512, 512, 560);
  g.addColorStop(0, '#33333a');
  g.addColorStop(1, '#121216');
  ctx.beginPath();
  ctx.arc(512, 512, 500, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(512, 512, 470, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5f5f7';
  ctx.font = '700 330px "JetBrains Mono", monospace';
  ctx.fillText('LH', 512, 472);

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '600 58px "JetBrains Mono", monospace';
  ctx.fillText('LI HAORAN', 512, 722);

  ctx.fillStyle = 'rgba(255,59,48,0.9)';
  ctx.font = '500 40px "JetBrains Mono", monospace';
  ctx.fillText('EMBEDDED · 2026', 512, 802);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeEnvTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#565660');
  g.addColorStop(0.5, '#18181c');
  g.addColorStop(1, '#050506');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  const r1 = ctx.createRadialGradient(280, 140, 10, 280, 140, 300);
  r1.addColorStop(0, 'rgba(255,255,255,1)');
  r1.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = r1;
  ctx.fillRect(0, 0, 1024, 512);

  const r2 = ctx.createRadialGradient(780, 130, 10, 780, 130, 260);
  r2.addColorStop(0, 'rgba(255,90,77,0.8)');
  r2.addColorStop(1, 'rgba(255,90,77,0)');
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, 1024, 512);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCoinGeometry(R, H, B, seg) {
  const pts = [];
  pts.push(new THREE.Vector2(0, -H));
  pts.push(new THREE.Vector2(R - B, -H));
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / 8);
    pts.push(new THREE.Vector2(R - B + B * Math.cos(a), -H + B + B * Math.sin(a)));
  }
  for (let i = 0; i <= 8; i++) {
    const a = (Math.PI / 2) * (i / 8);
    pts.push(new THREE.Vector2(R - B + B * Math.cos(a), H - B + B * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0, H));
  return new THREE.LatheGeometry(pts, seg);
}

function Env() {
  const tex = useMemo(() => makeEnvTexture(), []);
  const { scene } = useThree();
  useEffect(() => {
    scene.environment = tex;
    return () => {
      scene.environment = null;
    };
  }, [scene, tex]);
  return null;
}

function Coin({ control }) {
  const ref = useRef();
  const cur = useRef({ hoverTilt: 0, last: 0 });
  const face = useMemo(() => makeFaceTexture(), []);
  const coinGeo = useMemo(() => makeCoinGeometry(1.5, 0.1, 0.06, 96), []);
  const HOVER_SPEED = 1.7;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = control.current;
    const s = cur.current;
    const dt = s.last ? Math.min(0.05, t - s.last) : 0.016;
    s.last = t;

    if (c.hovering && !c.dragging) c.rotY += c.direction * HOVER_SPEED * dt;

    // 鼠标不在硬币上时，转回初始状态
    if (!c.hovering && !c.dragging) {
      const nearest = Math.round(c.rotY / (Math.PI * 2)) * (Math.PI * 2);
      c.rotY += (nearest - c.rotY) * 0.08;
      c.rotX += (0 - c.rotX) * 0.08;
    }

    const target = c.dragging ? 0 : c.targetX;
    s.hoverTilt += (target - s.hoverTilt) * 0.1;

    if (ref.current) {
      ref.current.rotation.y = c.rotY;
      ref.current.rotation.x = c.rotX + s.hoverTilt;
      ref.current.position.y = Math.sin(t * 0.9) * 0.05;
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={coinGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#d2d2d9" metalness={0.96} roughness={0.2} envMapIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0, 0.101]}>
        <circleGeometry args={[1.43, 96]} />
        <meshStandardMaterial map={face} metalness={0.7} roughness={0.34} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0, -0.101]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[1.43, 96]} />
        <meshStandardMaterial map={face} metalness={0.7} roughness={0.34} envMapIntensity={1.1} />
      </mesh>
    </group>
  );
}

export default function Portrait3D() {
  const control = useRef({ dragging: false, hovering: false, direction: 1, targetX: 0, rotY: 0, rotX: 0, lastX: 0, lastY: 0 });

  const onDown = (e) => {
    const c = control.current;
    c.dragging = true;
    c.lastX = e.clientX;
    c.lastY = e.clientY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 忽略 */
    }
  };
  const onMove = (e) => {
    const c = control.current;
    if (c.dragging) {
      c.rotY += (e.clientX - c.lastX) * 0.01;
      c.rotX = Math.max(-1.2, Math.min(1.2, c.rotX + (e.clientY - c.lastY) * 0.01));
      c.lastX = e.clientX;
      c.lastY = e.clientY;
    } else {
      const r = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      c.hovering = true;
      c.direction = nx < 0 ? -1 : 1; // 左半向左转、右半向右转
      c.targetX = -ny * 0.6; // 上半上仰、下半下俯
    }
  };
  const onUp = () => {
    control.current.dragging = false;
  };
  const onLeave = () => {
    control.current.dragging = false;
    control.current.hovering = false;
    control.current.targetX = 0;
  };

  return (
    <div
      className="portrait-coin3d"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    >
      <Canvas
        className="portrait-canvas"
        camera={{ position: [0, 0, 4.6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Env />
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 6, 8]} intensity={1.5} />
        <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#ff8a86" />
        <pointLight position={[-4, 2, 4]} intensity={5} color="#ff3b30" distance={20} decay={2} />
        <Coin control={control} />
      </Canvas>
    </div>
  );
}
