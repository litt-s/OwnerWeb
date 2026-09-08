import Reveal from './Reveal';

export default function SectionHeading({ index, eyebrow, title, sub }) {
  return (
    <Reveal className="section-head">
      <div className="head-eyebrow">
        <span className="head-index">{index}</span>
        <span className="head-rule" />
        <span>{eyebrow}</span>
      </div>
      <h2 className="head-title">{title}</h2>
      {sub && <p className="head-sub">{sub}</p>}
    </Reveal>
  );
}
