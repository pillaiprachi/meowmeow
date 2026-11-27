import {useLayoutEffect, useRef} from 'react';
import {ARCHIVE_EASE, ARCHIVE_TIME, Flip, gsap, reducedMotion} from '../motion/archive';

function frameBox(frame, {left, top, width, height}) {
  gsap.set(frame, {clearProps: 'transform', left, top, width, height});
}

const visibleBox = box => box && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;

export function ArchiveOverlay({kind, titleId, photo, source, trigger, origin, scroll, closing, onRequestClose, onClosed, children}) {
  const dialog = useRef(null);
  const flight = useRef(null);
  const animation = useRef(null);
  const callbacks = useRef({onClosed});
  callbacks.current.onClosed = onClosed;

  useLayoutEffect(() => {
    const node = dialog.current;
    const plane = flight.current;
    const close = node.querySelector('[data-archive-close]');
    const layer = node.querySelector('.archive-overlay-surface');
    const target = node.querySelector('[data-archive-destination]');
    const animatedParts = node.querySelectorAll('[data-archive-enter]');
    const prints = node.querySelectorAll('[data-archive-print]');
    const listeners = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    document.documentElement.classList.add('archive-lock');
    node.showModal();
    close.focus({preventScroll: true});
    window.addEventListener('resize', () => animation.current?.progress(1), {signal: listeners.signal});
    motion.addEventListener('change', () => {
      if (motion.matches) animation.current?.progress(1);
    }, {signal: listeners.signal});

    const setVisible = () => {
      gsap.set(plane, {autoAlpha: 0});
      gsap.set(layer, {clearProps: 'opacity,clipPath'});
      gsap.set(animatedParts, {clearProps: 'opacity,transform'});
      if (prints.length) gsap.set(prints, {clearProps: 'opacity,transform'});
    };

    if (!reducedMotion()) {
      const available = (origin && source?.querySelector('img')?.naturalWidth && visibleBox(origin));
      const entrance = gsap.timeline({onComplete: setVisible});
      animation.current = entrance;
      entrance.fromTo(layer, {opacity: .12, clipPath: kind === 'gallery' ? 'inset(3% 0 3% 0)' : 'inset(0%)'},
        {opacity: 1, clipPath: 'inset(0%)', duration: .52, ease: ARCHIVE_EASE.enter}, 0);
      entrance.fromTo(animatedParts, {opacity: 0, x: kind === 'gallery' ? 56 : 20},
        {opacity: 1, x: 0, stagger: .055, duration: .48, ease: ARCHIVE_EASE.enter}, available ? .28 : .12);
      if (prints.length) entrance.fromTo(prints, {opacity: 0, x: 90},
        {opacity: 1, x: 0, stagger: .037, duration: .55, ease: ARCHIVE_EASE.enter}, available ? .25 : .03);
      if (available) {
        gsap.set(plane, {autoAlpha: 1});
        frameBox(plane, origin);
        const start = Flip.getState(plane);
        frameBox(plane, target.getBoundingClientRect());
        entrance.add(Flip.from(start, {duration: ARCHIVE_TIME.enter, ease: ARCHIVE_EASE.travel, scale: false}), 0);
        entrance.to(plane, {autoAlpha: 0, duration: .18, ease: 'sine.out'}, .6);
      }
    }

    return () => {
      listeners.abort();
      animation.current?.kill();
      if (node.open) node.close();
      document.documentElement.classList.remove('archive-lock');
      if (Math.abs(window.scrollY - scroll) > 1) window.scrollTo({top: scroll, behavior: 'instant'});
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
    };
  }, [kind, origin, scroll, source, trigger]);

  useLayoutEffect(() => {
    if (!closing) return;
    const node = dialog.current;
    if (reducedMotion()) {
      callbacks.current.onClosed();
      return;
    }
    animation.current?.kill();
    const plane = flight.current;
    const target = node.querySelector('[data-archive-destination]');
    const layer = node.querySelector('.archive-overlay-surface');
    const current = plane.style.visibility === 'visible' ? plane.getBoundingClientRect() : target.getBoundingClientRect();
    Flip.killFlipsOf(plane, false);
    const returnBox = source?.getBoundingClientRect();
    const leave = gsap.timeline({onComplete: () => callbacks.current.onClosed()});
    animation.current = leave;
    leave.to(layer, {opacity: 0, duration: .29, ease: ARCHIVE_EASE.exit}, 0);
    if (source?.querySelector('img')?.naturalWidth && visibleBox(returnBox)) {
      frameBox(plane, current);
      const start = Flip.getState(plane);
      frameBox(plane, returnBox);
      leave.add(Flip.from(start, {duration: ARCHIVE_TIME.exit, ease: ARCHIVE_EASE.travel, scale: false}), 0);
      leave.to(plane, {autoAlpha: 1, duration: .09}, 0).to(plane, {autoAlpha: 0, duration: .08}, .35);
    } else {
      leave.to(plane, {autoAlpha: 0, duration: .24}, 0);
    }
  }, [closing, source]);

  return (
    <dialog className={`archive-overlay archive-overlay--${kind}${closing ? ' is-closing' : ''}`} aria-labelledby={titleId}
      ref={dialog} onCancel={event => { event.preventDefault(); onRequestClose(); }}>
      <div className="archive-overlay-surface">{children}</div>
      <div aria-hidden="true" className="archive-flight" ref={flight}>
        <img src={source?.querySelector('img')?.currentSrc || photo[0]} alt="" width={photo[1]} height={photo[2]} decoding="async" draggable="false" />
      </div>
    </dialog>
  );
}
