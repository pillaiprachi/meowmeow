import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './curva-preloader.css';

const entranceDuration = 1100;
const metadataStart = 950;
const metadataDuration = 360;
const countDuration = 1850;
const holdDuration = 500;
const exitDuration = 780;
const readinessDeadline = 5500;

const unit = value => Math.min(1, Math.max(0, value));
const easeOut = value => 1 - (1 - value) ** 3;
const easeInOut = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

// Pass progress as a percentage when the host measures loading. Otherwise the
// counter runs on the timeline and uses ready to determine when it can finish.
export function CurvaPreloader({ progress, ready = true, onComplete }) {
  const [finished, setFinished] = useState(false);
  const layerRef = useRef(null);
  const wordmarkRef = useRef(null);
  const metadataRef = useRef(null);
  const counterRef = useRef(null);
  const latest = useRef({ progress, ready, onComplete });

  useLayoutEffect(() => {
    latest.current = { progress, ready, onComplete };
  }, [progress, ready, onComplete]);

  useEffect(() => {
    const layer = layerRef.current;
    const wordmark = wordmarkRef.current;
    const metadata = metadataRef.current;
    const counter = counterRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const startedAt = performance.now();
    let previousFrame = startedAt;
    let frame;
    let displayed = 0;
    let lastNumber = 0;
    let entranceComplete = false;
    let metadataComplete = false;
    let completedAt;

    function tick(now) {
      const elapsed = now - startedAt;
      const delta = Math.min(100, Math.max(0, now - previousFrame));
      previousFrame = now;
      const reduced = reducedMotion.matches;
      if (!entranceComplete) {
        const entrance = reduced ? 1 : easeOut(unit(elapsed / entranceDuration));
        wordmark.style.opacity = entrance;
        wordmark.style.transform = `translateY(${40 * (1 - entrance)}px)`;
        entranceComplete = entrance === 1;
      }
      if (!metadataComplete) {
        const opacity = reduced ? 1 : easeOut(unit((elapsed - metadataStart) / metadataDuration));
        metadata.style.opacity = opacity;
        metadataComplete = opacity === 1;
      }

      const current = latest.current;
      const timedProgress = reduced ? 1 : unit((elapsed - entranceDuration) / countDuration);
      const timedOut = elapsed >= readinessDeadline;
      const measured = Number.isFinite(current.progress) && !timedOut ? unit(current.progress / 100) : 1;
      const target = 100 * Math.min(timedProgress, measured, current.ready || timedOut ? 1 : .96);
      const paced = reduced ? target : Math.min(target, displayed + delta * 108 / countDuration);
      displayed = Math.max(displayed, paced);
      const number = Math.floor(displayed);
      if (number !== lastNumber) {
        counter.textContent = String(number).padStart(3, '0');
        lastNumber = number;
      }

      if (number === 100) {
        completedAt ??= now;
        const exitElapsed = now - completedAt - (reduced ? 120 : holdDuration);
        if (exitElapsed >= 0) {
          const exit = reduced ? 1 : unit(exitElapsed / exitDuration);
          layer.style.transform = `translateY(${-100 * easeInOut(exit)}%)`;
          if (exit === 1) {
            setFinished(true);
            current.onComplete?.();
            return;
          }
        }
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (finished) return null;

  return (
    <div className="curva-preloader" role="status" aria-label="Loading CURVA">
      <div className="curva-preloader__layer" ref={layerRef} aria-hidden="true">
        <div className="curva-preloader__composition">
          <div className="curva-preloader__mask">
            <span className="curva-preloader__wordmark" ref={wordmarkRef}>CURVA</span>
          </div>
          <div className="curva-preloader__metadata" ref={metadataRef}>
            <span>SILK · ARTWORK · ARCHIVE</span>
            <span ref={counterRef}>000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
