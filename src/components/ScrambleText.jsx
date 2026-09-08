import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789!<>-_\\/[]{}—=+*^?#$%';

function scrambleLine(text, progress) {
  const reveal = Math.floor(progress * text.length);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n' || ch === ' ') {
      out += ch;
      continue;
    }
    out += i < reveal || progress >= 1 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return out;
}

function CharEl({ ch }) {
  const [disp, setDisp] = useState(ch);
  const timer = useRef(0);

  const onEnter = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setDisp(GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    }, 110);
  };
  const onLeave = () => {
    clearInterval(timer.current);
    setDisp(ch);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <span className="scr-char" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {disp}
    </span>
  );
}

export default function ScrambleText({ text, className = '', duration = 850 }) {
  const [phase, setPhase] = useState('init');
  const [enterDisplay, setEnterDisplay] = useState(() => scrambleLine(text, 0));
  const startRef = useRef(0);
  const startedRef = useRef(false);
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          startRef.current = performance.now();
          setPhase('enter');
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== 'enter') return;
    let id = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / duration);
      setEnterDisplay(scrambleLine(text, p));
      if (p < 1) id = requestAnimationFrame(tick);
      else setPhase('idle');
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase, text, duration]);

  const renderLines = (str, interactive) =>
    str.split('\n').map((line, li) => (
      <span key={li}>
        {li > 0 && <br />}
        {interactive
          ? line.split('').map((ch, ci) =>
              ch === ' ' ? (
                <span key={ci} className="scr-space">
                  &nbsp;
                </span>
              ) : (
                <CharEl key={ci} ch={ch} />
              )
            )
          : line}
      </span>
    ));

  return (
    <span ref={elRef} className={className}>
      {phase === 'idle' ? renderLines(text, true) : renderLines(enterDisplay, false)}
    </span>
  );
}
