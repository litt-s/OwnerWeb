import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Aurora from './Aurora';
import { useContent } from '../context/ContentContext';

const MCU3D = lazy(() => import('./MCU3D'));

export default function Hero() {
  const { siteContent } = useContent();
  const { hero } = siteContent;
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
          <a className="hero-scroll-hint" href="#experience" aria-label="向下滑动查看更多内容">
            <span>SCROLL TO EXPLORE</span>
            <span className="hero-scroll-arrow" aria-hidden="true" />
          </a>
        </div>

        {/* 窄屏下 3D 标注会隐藏，这里提供等价的按钮导航 */}
        <nav className="hero-quicklinks" aria-label="快速导航">
          <Link to="/projects">精选项目</Link>
          <Link to="/experience">个人经历</Link>
          <Link to="/strengths">个人优势</Link>
          <Link to="/comments">访客留言</Link>
          <a href="#contact">联系我</a>
        </nav>
      </div>
    </section>
  );
}
