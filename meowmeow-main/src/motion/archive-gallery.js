import {gsap, reducedMotion, ARCHIVE_EASE} from './archive';

const wrap = (index, count) => ((index % count) + count) % count;
const clamp = gsap.utils.clamp;

export function mountGallery(viewport, photos, onSettled) {
  const slots = [...viewport.querySelectorAll('.archive-gallery-slot')].map(node => ({node, image: node.querySelector('img')}));
  const controller = new AbortController();
  const {signal} = controller;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const model = {position: 0, force: 0};
  const count = photos.length;
  const radius = Math.floor(slots.length / 2);
  let stride = 1;
  let maxYaw = 22;
  let depthStep = 48;
  let smallImages = false;
  let pointer;
  let tween;
  let frame;
  let target = 0;

  function render() {
    frame = undefined;
    const center = Math.round(model.position);
    const still = motion.matches;
    for (let index = center - radius; index <= center + radius; index += 1) {
      const slot = slots[wrap(index, slots.length)];
      const offset = index - model.position;
      if (Math.abs(offset) > 2.35) {
        slot.node.style.visibility = 'hidden';
        continue;
      }
      slot.node.style.visibility = 'visible';
      const photoIndex = wrap(index, count);
      const [file, width, height] = photos[photoIndex];
      const src = smallImages && photoIndex < 3 ? file.replace('.webp', '-640.webp') : file;
      if (slot.src !== src) {
        slot.src = src;
        slot.node.removeAttribute('data-missing');
        slot.image.width = width;
        slot.image.height = height;
        slot.image.src = src;
      }
      const distance = Math.min(Math.abs(offset), 1.4);
      // Each print faces the viewer at the center, then turns outward as it recedes.
      const yaw = still ? 0 : -maxYaw * Math.tanh(offset * 1.25);
      const depth = still ? 0 : -depthStep * distance;
      const pitch = still ? 0 : model.force * .68 * (1 - distance * .22);
      const scale = still ? 1 : 1 - distance * .085;
      const facing = Math.cos(yaw * Math.PI / 180);
      slot.node.style.transform = `translate3d(${offset * stride}px,0,${depth}px) rotateY(${yaw}deg) rotateX(${pitch}deg) scale(${scale})`;
      slot.node.style.opacity = 1 - distance * .20 - (1 - facing) * .38;
      slot.node.style.zIndex = Math.max(0, 10 - Math.round(distance * 4));
    }
  }

  function measure() {
    const width = viewport.clientWidth;
    if (!width) return;
    const compact = width < 720;
    smallImages = width * devicePixelRatio < 750;
    maxYaw = compact ? 13 : 22;
    depthStep = compact ? 28 : 48;
    const nextStride = Math.min(width * (compact ? .81 : .47), 790);
    if (pointer && nextStride !== stride) {
      pointer.origin = pointer.last;
      pointer.position = model.position;
      pointer.velocity = 0;
    }
    stride = nextStride;
    render();
  }

  function settle(index, speed = 0) {
    target = index;
    tween?.kill();
    if (motion.matches) {
      model.position = index;
      model.force = 0;
      target = model.position;
      render();
      onSettled(wrap(target, count));
      return;
    }
    tween = gsap.to(model, {
      position: target, force: 0, duration: clamp(.35, .85, .42 + .13 * Math.abs(index - model.position) + .03 * Math.abs(speed)),
      ease: ARCHIVE_EASE.settle, onUpdate: render,
      onComplete() {
        onSettled(wrap(index, count));
      },
    });
  }

  function grab(event) {
    if (!event.isPrimary || event.button !== 0) return;
    tween?.kill();
    pointer = {id: event.pointerId, origin: event.clientX, last: event.clientX, time: event.timeStamp, position: model.position, velocity: 0};
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  }

  function drag(event) {
    if (pointer?.id !== event.pointerId) return;
    const time = event.timeStamp;
    const velocity = (event.clientX - pointer.last) / Math.max(5, time - pointer.time);
    pointer.velocity = pointer.velocity * .32 + velocity * .68;
    pointer.last = event.clientX;
    pointer.time = time;
    model.position = pointer.position - (event.clientX - pointer.origin) / stride;
    model.force = clamp(-4.2, 4.2, pointer.velocity * 2.3);
    if (frame === undefined) frame = requestAnimationFrame(render);
  }

  function release(event) {
    if (pointer?.id !== event.pointerId) return;
    const speed = event.type === 'pointerup' && event.timeStamp - pointer.time < 100 ? pointer.velocity : 0;
    const coast = motion.matches ? 0 : clamp(-2.25, 2.25, speed * 230 / stride);
    const offset = (pointer.origin - pointer.last) / stride;
    let destination = Math.round(model.position - coast);
    if (Math.abs(offset) > .18 && destination === Math.round(pointer.position)) destination += Math.sign(offset);
    pointer = undefined;
    viewport.classList.remove('is-dragging');
    cancelAnimationFrame(frame);
    frame = undefined;
    settle(destination, speed);
  }

  for (const {node, image} of slots) {
    image.addEventListener('error', () => node.setAttribute('data-missing', ''), {signal});
  }
  viewport.addEventListener('pointerdown', grab, {signal});
  viewport.addEventListener('pointermove', drag, {signal});
  viewport.addEventListener('pointerup', release, {signal});
  viewport.addEventListener('pointercancel', release, {signal});
  viewport.addEventListener('lostpointercapture', release, {signal});
  motion.addEventListener('change', () => {
    if (motion.matches) settle(Math.round(model.position));
    else render();
  }, {signal});
  const resize = new ResizeObserver(measure);
  resize.observe(viewport);
  measure();

  return {
    step(direction) { settle(target + direction); },
    jump(index) {
      const closest = index + Math.round((model.position - index) / count) * count;
      if (reducedMotion()) settle(closest);
      else {
        // Keep a long keyboard jump within one print of the destination.
        if (Math.abs(closest - model.position) > 2) model.position = closest - Math.sign(closest - model.position);
        settle(closest);
      }
    },
    dispose() {
      controller.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
      tween?.kill();
    },
  };
}
