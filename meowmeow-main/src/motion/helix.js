import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const mod = (value, size) => ((value % size) + size) % size;
const smooth = (start, end, value) => {
  const t = gsap.utils.clamp(0, 1, (value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function mountHelix(section, {ties, onSettle, onMove, onInspect}) {
  const stage = section.querySelector('.hx-stage');
  const items = [...section.querySelectorAll('.hx-tie')];
  const floats = [...section.querySelectorAll('.hx-float')];
  const count = ties.length, total = items.length;
  // Two full turns: every slot has a twin exactly one turn above or below it.
  const perTurn = total / 2, step = Math.PI * 2 / perTurn;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listeners = new AbortController();
  const {signal} = listeners;
  const state = {pos: 0, intro: 0, focus: 0};
  let width = 0, height = 0, radiusX = 0, radiusZ = 0, rise = 0;
  let travel = null, goal = 0, open = false, started = false, queued = 0;
  let lastPos = 0, lastTime = performance.now(), drag = null, dragged = false;

  const frontSlot = () => mod(Math.round(state.pos), total);
  // Signed distance of a slot from the front, wrapped so the helix is symmetrical about the centre.
  const offsetOf = slot => mod(slot - state.pos + total / 2, total) - total / 2;
  const moving = () => Boolean(travel?.isActive());

  function render() {
    const now = performance.now();
    const velocity = (state.pos - lastPos) / Math.max(.008, (now - lastTime) / 1000);
    lastPos = state.pos;
    lastTime = now;
    // Ties swing slightly against the direction of travel, like cloth on a turning stand.
    const lean = reduced ? 0 : gsap.utils.clamp(-8, 8, -velocity * 2.4);
    const entering = 1 - state.intro;
    const rx = radiusX * (1 + entering * 1.3), rz = radiusZ * (1 + entering * 1.3);
    items.forEach((item, slot) => {
      const offset = offsetOf(slot), distance = Math.abs(offset);
      const angle = offset * step;
      const x = Math.sin(angle) * rx;
      const z = (Math.cos(angle) - 1) * rz;
      const y = offset * rise * (1 + entering);
      // Face outward from the ellipse, so ties turn edge-on as they reach the sides.
      const facing = Math.atan2(rz * Math.sin(angle), rx * Math.cos(angle));
      const arrival = smooth(0, 1, state.intro * 1.6 - distance / total);
      const fade = 1 - smooth(perTurn * .55, total / 2, distance);
      const nearFront = Math.max(0, 1 - distance);
      const opacity = arrival * fade * (1 - state.focus * .72 * (1 - nearFront));
      item.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) ` +
        `rotateY(${facing.toFixed(4)}rad) rotateZ(${(lean * (.5 + .5 * nearFront)).toFixed(2)}deg)`;
      item.style.opacity = opacity.toFixed(3);
      item.style.visibility = opacity < .01 ? 'hidden' : '';
      item.style.filter = `brightness(${(.6 + .4 * Math.max(0, Math.cos(angle))).toFixed(3)})`;
      item.classList.toggle('is-front', distance < .5);
    });
  }

  function requestRender() {
    if (!queued) queued = requestAnimationFrame(() => {queued = 0; render()});
  }

  function measure() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    if (!width || !height) return;
    const narrow = width < 760;
    const tieHeight = Math.min(height * (narrow ? .48 : .56), 500);
    radiusX = Math.min(width * (narrow ? .38 : .33), 580);
    radiusZ = radiusX * .6;
    rise = tieHeight * .1;
    stage.style.setProperty('--tie-h', `${tieHeight}px`);
    stage.style.setProperty('--float-w', `${narrow ? width * .3 : gsap.utils.clamp(130, 240, width * .15)}px`);
    render();
    if (open) showDetails(true);
  }

  function start() {
    if (started) return;
    started = true;
    if (reduced) {
      state.intro = 1;
      render();
      settle();
      return;
    }
    // The ties sweep in around a wide ellipse and tighten onto the helix.
    state.pos = -perTurn * .75;
    goal = 0;
    travel = gsap.to(state, {pos: 0, intro: 1, duration: 2.4, ease: 'power3.out', onUpdate: requestRender, onComplete: settle});
  }

  function finishIntro() {
    started = true;
    if (state.intro < 1) {
      gsap.to(state, {intro: 1, duration: reduced ? 0 : .5, ease: 'power2.out', overwrite: 'auto', onUpdate: requestRender});
    }
  }

  function moveTo(target) {
    finishIntro();
    hideDetails();
    travel?.kill();
    goal = target;
    const distance = Math.abs(target - state.pos);
    if (distance < .001) {
      settle();
      return;
    }
    travel = gsap.to(state, {
      pos: target,
      duration: reduced ? 0 : Math.min(1.7, .6 + distance * .14),
      ease: 'power3.inOut',
      onUpdate: requestRender,
      onComplete: settle
    });
  }

  function shift(by) {
    moveTo((moving() ? goal : Math.round(state.pos)) + by);
  }

  function goToSlot(slot) {
    moveTo(Math.round(state.pos + offsetOf(slot)));
  }

  function settle() {
    render();
    const index = frontSlot() % count;
    showDetails(false);
    onSettle(index);
  }

  function showDetails(instant) {
    const slot = frontSlot();
    const tie = ties[slot % count];
    const stageBox = stage.getBoundingClientRect(), tieBox = items[slot].getBoundingClientRect();
    const floatWidth = floats[0].offsetWidth, floatHeight = floats[0].offsetHeight;
    const centerX = width / 2, centerY = height / 2;
    const spreadX = Math.min(width / 2 - floatWidth / 2 - 16, tieBox.width / 2 + floatWidth / 2 + width * .06);
    const spreadY = tieBox.height * .2;
    open = true;
    section.classList.add('is-open');
    gsap.to(state, {focus: 1, duration: instant || reduced ? 0 : .6, ease: 'power2.out', overwrite: 'auto', onUpdate: requestRender});
    floats.forEach((float, end) => {
      const sign = end ? 1 : -1;
      const photo = tie.details[end];
      float.style.backgroundImage = `url("${photo || tie.image}")`;
      float.style.backgroundSize = photo ? 'cover' : '290% auto';
      float.style.backgroundPosition = photo ? '50% 50%' : `50% ${end ? 93 : 7}%`;
      // Opposite corners around the centre, so the composition stays point-symmetrical.
      const rest = {x: centerX + sign * spreadX - floatWidth / 2, y: centerY + sign * spreadY - floatHeight / 2};
      gsap.killTweensOf(float);
      if (instant || reduced) {
        gsap.set(float, {...rest, scale: 1, rotation: sign * -3, yPercent: 0, opacity: 1});
        return;
      }
      // Each image leaves from its own end of the tie: one from the knot, one from the tip.
      gsap.set(float, {
        x: tieBox.left - stageBox.left + tieBox.width / 2 - floatWidth / 2,
        y: tieBox.top - stageBox.top + tieBox.height * (end ? .9 : .1) - floatHeight / 2,
        scale: .12, rotation: sign * 18, yPercent: 0, opacity: 0
      });
      const delay = .08 + end * .06;
      // Different eases on x and y curve the path instead of a straight slide.
      gsap.to(float, {x: rest.x, duration: 1, ease: 'power2.out', delay});
      gsap.to(float, {y: rest.y, scale: 1, rotation: sign * -3, duration: 1, ease: 'power4.out', delay});
      gsap.to(float, {opacity: 1, duration: .35, delay});
      gsap.to(float, {yPercent: sign * 3, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: delay + 1});
    });
  }

  function hideDetails() {
    if (!open) return;
    open = false;
    section.classList.remove('is-open');
    onMove();
    gsap.to(state, {focus: 0, duration: reduced ? 0 : .35, ease: 'power2.out', overwrite: 'auto', onUpdate: requestRender});
    floats.forEach((float, end) => {
      gsap.killTweensOf(float);
      gsap.to(float, {opacity: 0, scale: .4, rotation: (end ? 1 : -1) * 12, duration: reduced ? 0 : .3, ease: 'power2.in'});
    });
  }

  items.forEach((item, slot) => item.addEventListener('click', () => {
    if (dragged) return;
    if (item.classList.contains('is-front') && !moving()) onInspect(slot % count, item);
    else goToSlot(slot);
  }, {signal}));

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.hx-caption')) return;
    drag = {id: event.pointerId, x: event.clientX, pos: state.pos, last: event.clientX, time: event.timeStamp, velocity: 0};
    dragged = false;
  }, {signal});
  stage.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!dragged) {
      if (Math.abs(event.clientX - drag.x) < 6) return;
      dragged = true;
      stage.setPointerCapture(event.pointerId);
      finishIntro();
      travel?.kill();
      hideDetails();
      drag.pos = state.pos;
      drag.x = drag.last = event.clientX;
    }
    const perItem = radiusX * step;
    state.pos = drag.pos - (event.clientX - drag.x) / perItem;
    const elapsed = Math.max(1, event.timeStamp - drag.time);
    drag.velocity = (drag.last - event.clientX) / perItem / elapsed * 1000;
    drag.last = event.clientX;
    drag.time = event.timeStamp;
    requestRender();
  }, {signal});
  const release = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const {velocity} = drag;
    drag = null;
    // A flick carries on for up to three ties, then snaps to the nearest one.
    if (dragged) moveTo(Math.round(state.pos + gsap.utils.clamp(-3, 3, velocity * .2)));
  };
  stage.addEventListener('pointerup', release, {signal});
  stage.addEventListener('pointercancel', release, {signal});

  stage.addEventListener('keydown', event => {
    if (event.target !== stage) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      shift(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const slot = frontSlot();
      onInspect(slot % count, items[slot]);
    }
  }, {signal});

  const sizing = new ResizeObserver(measure);
  sizing.observe(stage);
  measure();
  const trigger = ScrollTrigger.create({trigger: section, start: 'top 70%', once: true, onEnter: start});

  return {
    shift,
    dispose() {
      listeners.abort();
      sizing.disconnect();
      trigger.kill();
      cancelAnimationFrame(queued);
      gsap.killTweensOf([state, ...floats]);
    }
  };
}