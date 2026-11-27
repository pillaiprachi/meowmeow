import THREE from '../vendor/three.r128.min.cjs';

export function mountLookbook(section, onSpread) {
  const listeners = new AbortController();
  const {signal} = listeners;
  let imageObserver, resizeObserver;

  const viewport = section.querySelector('.lookbook-viewport');
  const pages = [...viewport.querySelectorAll('.lookbook-page')];
  const mobile = matchMedia('(max-width: 700px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // On desktop, page indexes the left slot. The cover starts in the right slot.
  let page = mobile.matches ? 0 : -1;
  let turn;
  let gesture;
  let frame = 0;
  let paper;
  let fallback;

  const clamp = (number, min = 0, max = 1) => Math.min(max, Math.max(min, number));
  const folio = number => String(number).padStart(2, '0');
  const step = () => mobile.matches ? 1 : 2;
  const inRange = index => index >= (mobile.matches ? 0 : -1) && index < pages.length;

  function place(left, right) {
    pages.forEach((sheet, index) => {
      if (index === left) sheet.dataset.slot = 'left';
      else if (index === right) sheet.dataset.slot = 'right';
      else delete sheet.dataset.slot;
    });
  }

  function show() {
    const first = Math.max(0, page);
    const end = Math.min(page + step(), pages.length);
    place(page, mobile.matches ? null : page + 1);
    pages.forEach((sheet, index) => sheet.setAttribute('aria-hidden', index < first || index >= end));
    onSpread({
      label: end - first === 1 ? `Page ${folio(first + 1)} of ${pages.length}` : `Pages ${folio(first + 1)}–${folio(end)} of ${pages.length}`,
      previous: inRange(page - step()),
      next: inRange(page + step())
    });
  }

  function paintPage(sheet) {
    const rect = sheet.getBoundingClientRect();
    const bitmap = document.createElement('canvas');
    const scale = Math.min(devicePixelRatio, 2, 1400 / rect.height);
    bitmap.width = Math.ceil(rect.width * scale);
    bitmap.height = Math.ceil(rect.height * scale);
    bitmap.getContext('2d').drawImage(sheet.querySelector('img'), 0, 0, bitmap.width, bitmap.height);
    return bitmap;
  }

  function makePaper() {
    const three = THREE;

    let renderer;
    if (location.protocol !== 'file:') {
      try {
        renderer = new three.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      } catch {
        // Canvas can project the same paper when WebGL is unavailable.
      }
    }
    const overlay = renderer?.domElement ?? document.createElement('canvas');
    overlay.className = 'lookbook-turn';
    overlay.setAttribute('aria-hidden', 'true');
    const shadow = document.createElement('canvas');
    shadow.className = 'lookbook-cast-shadow';
    shadow.setAttribute('aria-hidden', 'true');
    const shade = shadow.getContext('2d');
    const scene = new three.Scene();
    const camera = new three.Camera();
    const columns = renderer ? 52 : 26;
    const rows = renderer ? 16 : 5;
    const geometry = new three.PlaneBufferGeometry(1, 1, columns, rows);
    const positions = geometry.attributes.position;
    positions.setUsage(three.DynamicDrawUsage);
    const uniforms = {
      front: { value: null }, back: { value: null },
      direction: { value: 1 }, bend: { value: 0 },
      extent: { value: new three.Vector2() }, bound: { value: 1 }
    };
    const material = new three.ShaderMaterial({
      uniforms,
      side: three.DoubleSide,
      vertexShader: `
        uniform vec2 extent;
        varying vec2 paperUv;
        varying vec3 paperNormal;
        void main() {
          paperUv = uv;
          paperNormal = normal;
          gl_Position = vec4(position.xy / extent, -position.z * .5, 1. - position.z * .125);
        }
      `,
      fragmentShader: `
        uniform sampler2D front, back;
        uniform float direction, bend, bound;
        varying vec2 paperUv;
        varying vec3 paperNormal;
        void main() {
          bool face = gl_FrontFacing == (direction > 0.);
          bool readable = face == (direction > 0.);
          vec2 art = vec2(readable ? paperUv.x : 1. - paperUv.x, paperUv.y);
          vec3 colour = (face ? texture2D(front, art) : texture2D(back, art)).rgb;
          vec3 n = normalize(paperNormal) * (gl_FrontFacing ? 1. : -1.);
          float light = max(0., dot(n, normalize(vec3(-.45, .38, .8))));
          float grazing = 1. - abs(n.z);
          float gutter = (1. - smoothstep(0., .115, paperUv.x)) * .24 * bound;
          float diffuse = 1. + (light - .81) * .30 * bend - grazing * .10 * bend - gutter;
          float edge = smoothstep(.997, 1., paperUv.x) * bend * .40;
          gl_FragColor = vec4(mix(colour * diffuse, vec3(.85, .81, .73), edge), 1.);
        }
      `
    });
    const mesh = new three.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const flatRenderer = renderer ? null : makeCanvasProjection(overlay, columns, rows);
    let width, height, leaf, pageHeight, spine;
    const texture = image => {
      const map = new three.CanvasTexture(image);
      map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return map;
    };

    function mount(front, back, direction) {
      width = viewport.clientWidth;
      height = viewport.clientHeight;
      leaf = width / step();
      pageHeight = height / leaf;
      spine = mobile.matches ? -direction * .5 : 0;
      const padX = leaf * .52;
      const padY = leaf * .34;
      if (renderer) {
        renderer.setSize(width + padX * 2, height + padY * 2);
        uniforms.front.value = texture(front);
        uniforms.back.value = texture(back);
      } else flatRenderer.mount(front, back, width + padX * 2, height + padY * 2);
      overlay.style.left = `${-padX}px`;
      overlay.style.top = `${-padY}px`;
      uniforms.extent.value.set((width / leaf) / 2 + .52, pageHeight / 2 + .34);
      uniforms.direction.value = direction;
      uniforms.bound.value = mobile.matches ? 0 : 1;
      shadow.width = Math.ceil(width);
      shadow.height = Math.ceil(height);
      viewport.append(shadow, overlay);
    }

    function draw(progress, grip) {
      const direction = uniforms.direction.value;
      const bend = Math.sin(progress * Math.PI);
      const base = progress * Math.PI - bend * .68;
      const twist = (grip * 2 - 1) * .95;
      uniforms.bend.value = bend;

      // Integrate the bending angle along the paper so its width stays constant.
      // The turn leads at the gripped corner while the entire spine remains fixed.
      for (let row = 0; row <= rows; row++) {
        const v = row / rows;
        let x = spine;
        let z = .003;
        for (let column = 0; column <= columns; column++) {
          const u = column / columns;
          if (column > 0) {
            const t = (column - .5) / columns;
            const curl = (1.92 - .8 * progress + twist * (v - .5)) * Math.pow(t, 1.42);
            const angle = base + bend * curl;
            x += direction * Math.cos(angle) / columns;
            z += Math.sin(angle) / columns;
          }
          const y = (.5 - v) * pageHeight + twist * bend * u * u * .045;
          positions.setXYZ(row * (columns + 1) + column, x, y, z);
        }
      }
      positions.needsUpdate = true;
      if (renderer) geometry.computeVertexNormals();

      shade.clearRect(0, 0, width, height);
      const middle = Math.round(rows * .55) * (columns + 1) + Math.round(columns * .8);
      const edgeX = width / 2 + positions.getX(middle) * leaf;
      const softness = leaf * (.066 + .46 * bend);
      const penumbra = shade.createLinearGradient(edgeX - softness, 0, edgeX + softness, 0);
      penumbra.addColorStop(0, 'rgba(30, 23, 15, 0)');
      penumbra.addColorStop(.46, `rgba(30, 23, 15, ${bend * .34})`);
      penumbra.addColorStop(1, 'rgba(30, 23, 15, 0)');
      shade.fillStyle = penumbra;
      shade.fillRect(edgeX - softness, 0, softness * 2, height);
      if (renderer) renderer.render(scene, camera);
      else flatRenderer.draw(positions, uniforms.extent.value, direction);
    }

    function unmount() {
      for (const name of ['front', 'back']) {
        uniforms[name].value?.dispose();
        uniforms[name].value = null;
      }
      flatRenderer?.unmount();
      overlay.remove();
      shadow.remove();
    }

    return {
      mount, draw, unmount,
      available: () => !renderer?.getContext().isContextLost(),
      dispose() {
        unmount();
        geometry.dispose();
        material.dispose();
        renderer?.dispose();
      }
    };
  }

  function makeCanvasProjection(canvas, columns, rows) {
    const brush = canvas.getContext('2d');
    const points = [];
    const tiles = [];
    const stride = columns + 1;

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const i = row * stride + col;
        points.push({ u: col / columns, v: row / rows, x: 0, y: 0, z: 0 });
        if (row < rows && col < columns) tiles.push({ i, depth: 0 });
      }
    }

    let front, back;
    function mount(recto, verso, width, height) {
      front = recto;
      back = verso;
      const scale = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    function drawTriangle(origin, horizontal, vertical, direction) {
      const xx = horizontal.x - origin.x;
      const xy = horizontal.y - origin.y;
      const yx = vertical.x - origin.x;
      const yy = vertical.y - origin.y;
      const area = xx * yy - xy * yx;
      if (Math.abs(area) < .05) return;
      const recto = Math.sign(area * (horizontal.u - origin.u) * (vertical.v - origin.v)) === direction;
      const bitmap = recto ? front : back;
      const reverse = recto !== (direction > 0);
      const u = (reverse ? 1 - origin.u : origin.u) * bitmap.width;
      const v = origin.v * bitmap.height;
      const du = (horizontal.u - origin.u) * bitmap.width * (reverse ? -1 : 1);
      const dv = (vertical.v - origin.v) * bitmap.height;
      brush.save();
      brush.beginPath();
      const vertices = [origin, horizontal, vertical];
      for (let i = 0; i < 3; i++) {
        // Offset both edges at each vertex so narrow triangles still overlap.
        const point = vertices[i], before = vertices[(i + 2) % 3], after = vertices[(i + 1) % 3];
        const incoming = Math.hypot(point.x - before.x, point.y - before.y);
        const outgoing = Math.hypot(after.x - point.x, after.y - point.y);
        const nx = (point.y - before.y) / incoming, ny = (before.x - point.x) / incoming;
        const mx = (after.y - point.y) / outgoing, my = (point.x - after.x) / outgoing;
        const overlap = Math.sign(area) * .8 / Math.max(.05, 1 + nx * mx + ny * my);
        brush.lineTo(point.x + (nx + mx) * overlap, point.y + (ny + my) * overlap);
      }
      brush.closePath();
      brush.clip();
      const a = xx / du, b = xy / du, c = yx / dv, d = yy / dv;
      brush.setTransform(a, b, c, d, origin.x - a * u - c * v, origin.y - b * u - d * v);
      const apron = 18;
      const sx = Math.max(0, Math.min(u, u + du) - apron);
      const sy = Math.max(0, Math.min(v, v + dv) - apron);
      const sw = Math.min(bitmap.width, Math.max(u, u + du) + apron) - sx;
      const sh = Math.min(bitmap.height, Math.max(v, v + dv) + apron) - sy;
      brush.drawImage(bitmap, sx, sy, sw, sh, sx, sy, sw, sh);
      brush.restore();
    }

    function draw(positions, extent, direction) {
      const halfWidth = canvas.width / 2;
      const halfHeight = canvas.height / 2;
      for (const [i, point] of points.entries()) {
        point.z = positions.getZ(i);
        const perspective = 1 - point.z * .125;
        point.x = halfWidth * (1 + positions.getX(i) / extent.x / perspective);
        point.y = halfHeight * (1 - positions.getY(i) / extent.y / perspective);
      }
      for (const tile of tiles) tile.depth = points[tile.i].z + points[tile.i + stride + 1].z;
      tiles.sort((a, b) => a.depth - b.depth);
      brush.clearRect(0, 0, canvas.width, canvas.height);
      for (const { i } of tiles) {
        const a = points[i], b = points[i + 1], c = points[i + stride], d = points[i + stride + 1];
        drawTriangle(a, b, c, direction);
        drawTriangle(d, c, b, direction);
      }
    }

    return { mount, draw, unmount: () => { front = null; back = null; } };
  }

  function draw(progress) {
    turn.progress = progress;
    if (fallback) {
      fallback.style.transform = `perspective(1100px) rotateY(${-turn.direction * progress * 180}deg)`;
      return;
    }
    paper.draw(progress, turn.grip);
  }

  function start(direction, grip) {
    const next = page + direction * step();
    if (turn || !inRange(next)) return false;

    const single = mobile.matches;
    const front = pages[!single && direction > 0 ? page + 1 : page];
    const back = single ? null : pages[direction > 0 ? next : next + 1];
    if (reducedMotion.matches) {
      turn = { direction, next, progress: 0, grip };
      return true;
    }

    paper ??= makePaper() || false;
    if (paper && paper.available() && [front, back].every(sheet => !sheet || sheet.querySelector('img').naturalWidth)) {
      const reverse = back ? paintPage(back) : document.createElement('canvas');
      if (!back) {
        reverse.width = reverse.height = 2;
        const ink = reverse.getContext('2d');
        ink.fillStyle = '#fff';
        ink.fillRect(0, 0, 2, 2);
      }
      paper.mount(paintPage(front), reverse, direction);
    } else {
      fallback = front.cloneNode(true);
      fallback.setAttribute('aria-hidden', 'true');
      fallback.style.zIndex = 3;
      fallback.style.backfaceVisibility = 'hidden';
      fallback.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
      viewport.append(fallback);
    }

    turn = { direction, next, progress: 0, grip };
    if (single) place(next, null);
    else if (direction > 0) place(page, next + 1);
    else place(next, page + 1);
    draw(0);
    return true;
  }

  function finish(commit) {
    cancelAnimationFrame(frame);
    frame = 0;
    if (commit) page = turn.next;
    turn = null;
    fallback?.remove();
    fallback = null;
    if (paper) paper.unmount();
    show();
  }

  function release(commit, fromDrag = false) {
    const from = turn.progress;
    const to = Number(commit);
    if (reducedMotion.matches || Math.abs(to - from) < .002) {
      finish(commit);
      return;
    }
    const duration = fromDrag ? 240 + Math.abs(to - from) * 510 : 1000;
    const startTime = performance.now();
    function animate(time) {
      const t = clamp((time - startTime) / duration);
      const eased = fromDrag ? 1 - (1 - t) ** 3 : t * t * (3 - 2 * t);
      if (t >= 1) finish(commit);
      else {
        draw(from + (to - from) * eased);
        frame = requestAnimationFrame(animate);
      }
    }
    frame = requestAnimationFrame(animate);
  }

  function turnBy(direction, grip = .86) {
    if (!gesture && start(direction, grip)) release(true);
  }

  function loadImages() {
    for (const image of viewport.querySelectorAll('img')) image.loading = 'eager';
  }

  if ('IntersectionObserver' in window) {
    imageObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      loadImages();
      imageObserver.disconnect();
    }, { rootMargin: '700px' });
    imageObserver.observe(section);
  } else loadImages();

  section.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    turnBy(event.key === 'ArrowRight' ? 1 : -1);
  }, {signal});

  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || turn || gesture) return;
    const bounds = viewport.getBoundingClientRect();
    gesture = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      side: event.clientX - bounds.left < bounds.width / 2 ? -1 : 1,
      grip: clamp((event.clientY - bounds.top) / bounds.height),
      leaf: bounds.width / step(), latestX: event.clientX, latestTime: event.timeStamp,
      velocity: 0, moved: false
    };
    viewport.setPointerCapture(event.pointerId);
  }, {signal});

  viewport.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.moved && Math.abs(dx) >= 8 && Math.abs(dx) > Math.abs(dy)) {
      gesture.moved = true;
      const direction = dx < 0 ? 1 : -1;
      if (mobile.matches || direction === gesture.side) start(direction, gesture.grip);
      viewport.classList.toggle('is-dragging', Boolean(turn));
    }
    if (turn) {
      gesture.velocity = (event.clientX - gesture.latestX) / Math.max(1, event.timeStamp - gesture.latestTime);
      gesture.latestX = event.clientX;
      gesture.latestTime = event.timeStamp;
      const progress = clamp(-dx * turn.direction / (gesture.leaf * .95), 0, .995);
      if (reducedMotion.matches) turn.progress = progress;
      else draw(progress);
    }
  }, {signal});

  function endGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    const lifted = event.type === 'pointerup';
    const input = gesture;
    gesture = null;
    viewport.classList.remove('is-dragging');
    if (turn) {
      const flick = event.timeStamp - input.latestTime < 100 && -input.velocity * turn.direction > .4;
      release(lifted && (turn.progress > .34 || (turn.progress > .075 && flick)), true);
    } else if (lifted && !input.moved && Math.hypot(event.clientX - input.x, event.clientY - input.y) < 9) {
      turnBy(input.side, input.grip);
    }
  }

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(type, endGesture, {signal});

  mobile.addEventListener('change', () => {
    if (turn) finish(!gesture);
    gesture = null;
    viewport.classList.remove('is-dragging');
    if (mobile.matches) page = Math.max(0, page);
    else if (page % 2 === 0) page--;
    show();
  }, {signal});

  reducedMotion.addEventListener('change', () => {
    if (turn && !gesture) finish(true);
    else if (turn) finish(false);
    gesture = null;
    viewport.classList.remove('is-dragging');
  }, {signal});

  if ('ResizeObserver' in window) {
    let width = viewport.clientWidth;
    resizeObserver = new ResizeObserver(() => {
      const nextWidth = viewport.clientWidth;
      if (turn && nextWidth !== width) finish(!gesture);
      width = nextWidth;
    });
    resizeObserver.observe(viewport);
  }

  section.classList.add('lookbook-ready');
  show();
  function dispose() {
    listeners.abort();
    imageObserver?.disconnect();
    resizeObserver?.disconnect();
    cancelAnimationFrame(frame);
    paper?.dispose();
    fallback?.remove();
  }
  return {turnBy, dispose};
}
