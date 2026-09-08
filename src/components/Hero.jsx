import { lazy, Suspense } from 'react';
import Aurora from './Aurora';
import { hero } from '../data/resume';

const MCU3D = lazy(() => import('./MCU3D'));

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-media">
        <Aurora
          colorStops={['#ff3b30', '#5a0f0a', '#ff9d8a']}
          blend={0.6}
          amplitude={0.95}
          speed={0.6}
        />
        <div className="hero-veil" />
      </div>

      <div className="hero-inner container">
        <div className="hero-model" aria-label="交互式 STM32 PCB 模型">
          <Suspense fallback={<div className="model-loading">LOADING MODEL</div>}>
            <MCU3D />
          </Suspense>
        </div>

        <div className="hero-text">
          <h1 className="hero-title">
            <span className="t-line">{hero.headFirst}，</span>
            <span className="t-line accent">{hero.headSecond}</span>
          </h1>
          <p className="hero-sub">{hero.sub}</p>
        </div>
      </div>
    </section>
  );
}
