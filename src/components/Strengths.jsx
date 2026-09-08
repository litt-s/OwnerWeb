import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { strengths } from '../data/resume';

export default function Strengths() {
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
            <Reveal className="str-card" key={s.n} delay={(i % 3) * 90}>
              <div className="str-top">
                <span className="str-n">{s.n}</span>
                <span className="str-bar" />
              </div>
              <h3 className="str-title">{s.title}</h3>
              <p className="str-desc">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
