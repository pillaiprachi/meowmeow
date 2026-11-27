import {useLayoutEffect, useRef, useState} from 'react';
import {mountHero} from '../motion/hero';
import {PRODUCTS} from '../shop/store';

const stageTitles = [<>SILK<em>IN MOTION</em></>, 'SHAPE', 'PRINT', 'LA CORSA'];
const sequence = ['SILK', '→ SHAPE', '→ PRINT', '→ THE TIE'];

export function Hero() {
  const section = useRef(null);
  const canvas = useRef(null);
  const [stage, setStage] = useState(0);
  const [still, setStill] = useState(false);
  const opening = stage === 0 && !still;

  useLayoutEffect(() => {
    const hero = section.current;
    const header = document.getElementById('nav');
    const listeners = new AbortController();
    const {signal} = listeners;
    function updateHeader() {
      const {top, bottom} = hero.getBoundingClientRect();
      const center = header.offsetHeight / 2;
      header.classList.toggle('site-header--over-hero', top <= center && bottom > center);
    }
    window.addEventListener('scroll', updateHeader, {passive: true, signal});
    window.addEventListener('resize', updateHeader, {signal});
    updateHeader();

    const dispose = mountHero(canvas.current, hero, header, setStage);
    if (!dispose) {
      setStill(true);
      setStage(3);
    }
    return () => {
      listeners.abort();
      dispose?.();
    };
  }, []);

  return (
    <section id="hero" ref={section} className={still ? 'hero-static' : opening ? 'silk-opening' : undefined}>
      <div className="stk">
        {still ? (
          <img className="hero-still" src={PRODUCTS['la-corsa'].img} alt="La Corsa, an olive-green silk tie printed with Ronaldo running on a football pitch" />
        ) : (
          <canvas id="cv" ref={canvas} role="img" aria-label="Olive-green silk becoming the La Corsa tie" />
        )}
        <div className="L">
          {stageTitles.map((title, index) => (
            <div className={stage === index ? 'st on' : 'st'} key={index}>
              <i>{String(index + 1).padStart(2, '0')}</i><p className="h">{title}</p>
              {index === 3 && <a className="cta" href="#rack">EXPLORE THE COLLECTION →</a>}
            </div>
          ))}
        </div>
        <div className="R" style={{opacity: opening ? 1 : 0}}>A TIE<br />A STORY<br />A CANVAS</div>
        <ol className="seq">
          {sequence.map((label, index) => <li key={label} className={index <= stage ? 'on' : undefined}>{label}</li>)}
          <li style={{marginLeft: 'auto', opacity: .6}}>SCROLL</li>
        </ol>
      </div>
    </section>
  );
}
