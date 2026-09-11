import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { useContent } from '../context/ContentContext';

export default function Strengths() {
  const content = useContent() || {};
  const strengths = content.strengths || [];
  const strengthsLoading = content.strengthsLoading || false;

  return (
    <section id="strengths" className="section str">
      <div className="container">
        <SectionHeading
          index="03"
          eyebrow="Capabilities · 个人优势"
          title="能写驱动，也能写系统"
          sub="软硬结合，从寄存器到物联网平台都拿得起来。"
        />

        <div className="str-grid">
          {strengths.map((s, i) => (
            <Reveal className="str-card" key={s.id ?? i} delay={(i % 3) * 90}>
              <div className="str-top">
                <span className="str-n">{s.n || String(i + 1).padStart(2, '0')}</span>
                <span className="str-bar" />
              </div>
              <h3 className="str-title">{s.title}</h3>
              <p className="str-desc">{s.desc || ''}</p>
            </Reveal>
          ))}
        </div>
        {strengths.length === 0 && !strengthsLoading && (
          <p className="form-err">暂无个人优势。</p>
        )}
      </div>
    </section>
  );
}
