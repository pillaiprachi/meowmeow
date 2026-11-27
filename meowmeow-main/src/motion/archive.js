import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {Flip} from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

export {gsap, Flip};
export const ARCHIVE_EASE = {enter: 'power3.out', exit: 'power2.in', travel: 'power3.inOut', settle: 'power4.out'};
export const ARCHIVE_TIME = {enter: .78, exit: .42, reveal: .9};
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const range = (value, start, end) => gsap.utils.clamp(0, 1, (value - start) / (end - start));
const ease = gsap.parseEase(ARCHIVE_EASE.travel);
const enter = gsap.parseEase(ARCHIVE_EASE.enter);
const exit = gsap.parseEase(ARCHIVE_EASE.exit);
const interpolate = (from, to, value) => from + (to - from) * value;
const arc = (progress, start, end) => Math.sin(Math.PI * range(progress, start, end)) ** 2;

function chapterElements(chapter) {
  return {
    chapter,
    hero: chapter.querySelector('.archive-hero'),
    heading: chapter.querySelector('.archive-chapter-title span'),
    rail: chapter.querySelector('.archive-chapter-tools'),
    cards: [...chapter.querySelectorAll('.archive-card-motion')].map(track => ({track, photo: track.querySelector('.archive-card-photo')})),
  };
}

function move(element, x, y, opacity) {
  element.style.transform = `translate3d(${x}px,${y}px,0)`;
  element.style.opacity = opacity;
  element.style.pointerEvents = opacity < .55 ? 'none' : '';
}

function tiltPhoto(photo, depth, yaw, pitch) {
  photo.style.transform = `perspective(940px) translateZ(${depth}px) rotateY(${yaw}deg) rotateX(${pitch}deg)`;
}

function mountMorph(runway, previous, next) {
  const stage = runway.querySelector('.archive-morph-stage');
  const frame = stage.querySelector('.archive-morph-window');
  const paper = stage.querySelector('.archive-morph-paper');
  const outgoing = chapterElements(previous);
  const incoming = chapterElements(next);
  const [oldPhoto, newPhoto] = frame.querySelectorAll('img');
  const incomingLayer = newPhoto.parentElement;
  const right = runway.dataset.direction === 'right';
  const turn = right ? 1 : -1;
  const controls = [outgoing, incoming].flatMap(({heading, rail, cards}) => [heading, rail, ...cards.map(({track}) => track)]);
  const photos = [...outgoing.cards, ...incoming.cards].map(({photo}) => photo);
  let startRect, endRect, fullRect;
  let visible = false;

  function release() {
    if (!visible) return;
    visible = false;
    stage.classList.remove('is-playing');
    incoming.chapter.classList.remove('is-recomposing');
    outgoing.hero.classList.remove('is-projected');
    incoming.hero.classList.remove('is-projected');
    controls.forEach(node => {
      node.style.transform = '';
      node.style.opacity = '';
      node.style.pointerEvents = '';
    });
    photos.forEach(photo => photo.style.removeProperty('transform'));
  }

  function render(self) {
    const progress = self.progress;
    if (!startRect || progress <= 0 || progress >= 1) {
      release();
      return;
    }

    if (!visible) {
      visible = true;
      stage.classList.add('is-playing');
      outgoing.hero.classList.add('is-projected');
      incoming.hero.classList.add('is-projected');
    }

    const travel = window.scrollY - self.start;
    const toEnd = self.end - window.scrollY;
    const retreat = exit(range(progress, 0, .27));
    const arrive = enter(range(progress, .74, 1));
    const hold = Math.min(travel, 155);
    incoming.chapter.classList.toggle('is-recomposing', progress > .79);
    move(outgoing.heading, 0, hold - 59 * retreat, 1 - retreat);
    move(outgoing.rail, 34 * retreat, hold - 24 * retreat, 1 - retreat);
    move(incoming.heading, 0, 40 * (1 - arrive), arrive);
    move(incoming.rail, 28 * (1 - arrive), 0, arrive);

    outgoing.cards.forEach(({track, photo}, index) => {
      const shift = ease(range(progress, index * .045, .28 + index * .045));
      const side = index ? 1 : -1;
      move(track, side * 155 * shift, hold - 36 * shift, 1 - shift);
      tiltPhoto(photo, -46 * shift, -side * turn * 16 * shift, 7 * shift);
    });
    incoming.cards.forEach(({track, photo}, index) => {
      const shift = enter(range(progress, .72 + index * .065, .98 + index * .02));
      const side = index ? 1 : -1;
      const offset = 1 - shift;
      move(track, side * 128 * offset, 34 * offset, shift);
      tiltPhoto(photo, -62 * offset, side * turn * 15 * offset, -8 * offset);
    });

    const expanding = progress < .57;
    const from = expanding ? startRect : fullRect;
    const to = expanding ? fullRect : endRect;
    const geometry = expanding ? ease(range(progress, .09, .42)) : ease(range(progress, .57, .94));
    const [x, y, width, height] = from.map((value, index) => interpolate(value, to[index], geometry));
    const tether = expanding ? -Math.min(travel, 55) * (1 - geometry) : toEnd * geometry;

    // The outgoing print lifts first, faces the wipe, then banks back toward the next grid.
    const lift = arc(progress, .018, .54);
    const land = arc(progress, .52, .99);
    const yaw = turn * (29 * lift - 22 * land);
    const pitch = 10 * lift - 7 * land;
    const roll = turn * (-4 * lift + 3 * land);
    const depth = -142 * lift - 118 * land;
    const drift = turn * (38 * lift - 26 * land);
    const heightOffset = -16 * lift + 15 * land;
    const scale = 1 + .027 * lift + .015 * land;
    frame.style.transform = `translate3d(${x + drift}px,${y + tether + heightOffset}px,${depth}px) rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg) scale(${scale})`;
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    paper.style.opacity = Math.min(ease(range(progress, .12, .43)), 1 - enter(range(progress, .73, .99)));
    const wipe = ease(range(progress, .39, .65));
    incomingLayer.style.clipPath = right
      ? `inset(0 0 0 ${(1 - wipe) * 100}%)` : `inset(0 ${(1 - wipe) * 100}% 0 0)`;
    oldPhoto.style.scale = 1 + .055 * (expanding ? 1 - geometry : 0);
    newPhoto.style.scale = 1 + .055 * range(progress, .82, 1);
  }

  function measure(self) {
    const relativeRect = ({x, y, width, height}, scroll) => [x, y + window.scrollY - scroll, width, height];
    startRect = relativeRect(outgoing.hero.getBoundingClientRect(), self.start);
    endRect = relativeRect(incoming.hero.getBoundingClientRect(), self.end);
    fullRect = [0, 0, document.documentElement.clientWidth, stage.clientHeight];
    render(self);
  }

  function positionStage() {
    const overlap = previous.getBoundingClientRect().height - 12;
    runway.style.setProperty('--archive-morph-overlap', `${overlap}px`);
  }

  const listeners = new AbortController();
  const preload = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    for (const photo of [oldPhoto, newPhoto]) {
      photo.addEventListener('load', () => photo.classList.add('is-ready'), {signal: listeners.signal});
      photo.src = photo.dataset.src;
    }
    preload.disconnect();
  }, {rootMargin: '1100px 0px'});

  positionStage();
  ScrollTrigger.create({
    trigger: stage, start: 'top top', endTrigger: next, end: 'top 17%',
    pin: true, pinSpacing: false, onUpdate: render, onRefreshInit: positionStage, onRefresh: measure,
  });
  preload.observe(runway);

  return () => {
    listeners.abort();
    preload.disconnect();
    release();
    runway.style.removeProperty('--archive-morph-overlap');
  };
}

export function mountArchive(root, progress) {
  const queries = gsap.matchMedia();
  queries.add('(prefers-reduced-motion: no-preference)', () => {
    const listeners = new AbortController();
    const animations = new Set();
    const reveal = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        reveal.unobserve(target);
        if (target.dataset.revealed || target.closest('.archive--motion .archive-chapter:not(.archive-chapter--1)')) continue;
        target.dataset.revealed = 'true';
        const animation = gsap.timeline({onComplete: () => animations.delete(animation)});
        animations.add(animation);
        const from = target.dataset.reveal === 'right' ? 'inset(0 0 0 83%)' : 'inset(0 0 72% 0)';
        animation.fromTo(target, {clipPath: from}, {clipPath: 'inset(0%)', duration: ARCHIVE_TIME.reveal, ease: ARCHIVE_EASE.enter, clearProps: 'clipPath'});
        animation.fromTo(target.firstElementChild, {scale: 1.115}, {scale: 1, duration: 1.16, ease: ARCHIVE_EASE.settle, clearProps: 'transform'}, 0);
      }
    }, {threshold: .06});
    root.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));

    let activeControl;
    function resetPointer() {
      activeControl?.style.removeProperty('--aim-x');
      activeControl?.style.removeProperty('--aim-y');
      activeControl = undefined;
    }
    root.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const control = event.target.closest('.archive-card, .archive-gallery-trigger');
      if (control !== activeControl) resetPointer();
      if (!control) return;
      activeControl = control;
      const bounds = control.getBoundingClientRect();
      control.style.setProperty('--aim-x', (event.clientX - bounds.left) / bounds.width * 2 - 1);
      control.style.setProperty('--aim-y', (event.clientY - bounds.top) / bounds.height * 2 - 1);
    }, {signal: listeners.signal});
    root.addEventListener('pointerleave', resetPointer, {signal: listeners.signal});
    root.addEventListener('focusin', event => {
      root.classList.toggle('archive--keyboard-focus', event.target.matches('.archive-chapter :focus-visible'));
    }, {signal: listeners.signal});
    const usePointer = () => root.classList.remove('archive--keyboard-focus');
    for (const event of ['wheel', 'pointerdown', 'touchstart']) {
      window.addEventListener(event, usePointer, {passive: true, signal: listeners.signal});
    }

    gsap.fromTo(progress, {scaleX: 0}, {
      scaleX: 1, ease: 'none', scrollTrigger: {trigger: root, start: 'top top', end: 'bottom bottom', scrub: true},
    });
    return () => {
      listeners.abort();
      resetPointer();
      root.classList.remove('archive--keyboard-focus');
      reveal.disconnect();
      animations.forEach(animation => animation.revert());
    };
  });

  queries.add('(min-width: 1050px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', () => {
    root.classList.add('archive--motion');
    const dispose = [...root.querySelectorAll('.archive-runway')].map(runway =>
      mountMorph(runway, runway.previousElementSibling, runway.nextElementSibling));
    gsap.utils.toArray('.archive-hero-parallax', root).forEach(image => {
      gsap.fromTo(image, {xPercent: -2.2}, {
        xPercent: 2.2, ease: 'none', scrollTrigger: {trigger: image.closest('.archive-chapter'), start: 'top bottom', end: 'bottom top', scrub: true},
      });
    });
    ScrollTrigger.refresh();
    return () => {
      dispose.forEach(cleanup => cleanup());
      root.classList.remove('archive--motion');
    };
  });

  return () => queries.revert();
}
