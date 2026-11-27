import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

const inlineSizes = '(max-width: 760px) 94vw, 48vw';
const noMedia = [];
const rest = {scale: 1, x: 0, y: 0};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = value => String(value).padStart(2, '0');
const srcSet = ({preview, src, width}) => preview ? `${preview.src} ${preview.width}w, ${src} ${width}w` : undefined;

function imageFit(stage, photo) {
  const {left, top, width, height} = stage.getBoundingClientRect();
  const fit = Math.min(1, width / photo.width, height / photo.height);
  return {left, top, width, height, fit, imageWidth: photo.width * fit, imageHeight: photo.height * fit};
}

function Photo({photo, state, full, priority, onReady, onFail}) {
  const [useOriginal, setUseOriginal] = useState(false);
  const [broken, setBroken] = useState(false);
  const set = !full && !useOriginal ? srcSet(photo) : undefined;
  if (broken) return null;
  return (
    <div className="product-media-layer" data-state={state} aria-hidden={state !== 'current'}
      style={{'--source-width': `${photo.width}px`, '--source-height': `${photo.height}px`}}>
      <img src={photo.src} srcSet={set} sizes={set ? inlineSizes : undefined}
        width={photo.width} height={photo.height} alt={photo.alt} draggable="false" loading="eager" decoding="async"
        fetchPriority={priority ? 'high' : undefined} onLoad={event => onReady(photo, event.currentTarget)}
        onError={event => {
          if (set && !event.currentTarget.currentSrc.endsWith(photo.src)) setUseOriginal(true);
          else { setBroken(true); onFail(photo.src); }
        }} />
    </div>
  );
}

function PhotoStage({photo, adjacent, direction, stage, flight, full = false, view = rest, onFail, children, ...events}) {
  const [layers, setLayers] = useState({shown: null, leaving: null});
  const [inspectSource, setInspectSource] = useState(null);
  const pointer = useRef(null);
  const requested = useRef(photo?.src);
  const first = useRef(photo?.src);
  requested.current = photo?.src;
  const waiting = layers.shown?.src !== photo?.src;

  function reveal(candidate) {
    if (requested.current !== candidate.src) return;
    setLayers(current => current.shown?.src === candidate.src ? current : {shown: candidate, leaving: current.shown});
  }

  useLayoutEffect(() => {
    const incoming = stage.current.querySelector('[data-state="pending"] img');
    if (incoming?.complete && incoming.naturalWidth && photo) reveal(photo);
  }, [photo, stage]);

  useEffect(() => {
    if (waiting || !photo) return;
    for (const item of adjacent) {
      const preload = new Image();
      preload.fetchPriority = 'low';
      if (!full && item.preview) {
        preload.sizes = inlineSizes;
        preload.srcset = srcSet(item);
      }
      preload.src = item.src;
    }
  }, [adjacent, full, photo, waiting]);

  function inspect() {
    const frame = stage.current.querySelector('[data-state="current"]');
    if (!frame) return;
    const current = layers.shown;
    const img = frame.firstElementChild;
    const aim = pointer.current;
    if (!aim || waiting || !img.naturalWidth) {
      frame.style.removeProperty('--inspect-scale');
      return;
    }
    const {left, top, width, height, fit, imageWidth, imageHeight} = imageFit(stage.current, current);
    const x = aim.x - left - width / 2;
    const y = aim.y - top - height / 2;
    if (Math.abs(x) > imageWidth / 2 || Math.abs(y) > imageHeight / 2) {
      frame.style.removeProperty('--inspect-scale');
      return;
    }
    const sourceWidth = current.preview && img.currentSrc.endsWith(current.preview.src) ? current.preview.width : current.width;
    if (sourceWidth < current.width) setInspectSource(current.src);
    const scale = clamp(sourceWidth / current.width / fit, 1, 1.85);
    const boxWidth = Math.min(width, current.width);
    const boxHeight = Math.min(height, current.height);
    frame.style.setProperty('--inspect-origin', `${50 + 100 * x / boxWidth}% ${50 + 100 * y / boxHeight}%`);
    frame.style.setProperty('--inspect-scale', scale);
  }

  useLayoutEffect(() => {
    if (!full) inspect();
  }, [layers.shown, photo]);

  function onReady(candidate, img) {
    if (!full && candidate.src === layers.shown?.src) inspect();
    else img.decode().catch(() => {}).then(() => {
      if (img.isConnected) reveal(candidate);
    });
  }

  const visible = photo ? [...new Map([layers.leaving, layers.shown, photo].filter(Boolean).map(item => [item.src, item])).values()] : [];

  return (
    <div className="product-media-stage" ref={stage} data-archive-destination={flight ? '' : undefined}
      data-zoomed={view.scale > 1 ? '' : undefined} aria-busy={photo && waiting ? true : undefined}
      style={{'--slide-shift': `${direction * 6}px`, '--zoom-scale': view.scale, '--pan-x': `${view.x}px`, '--pan-y': `${view.y}px`}}
      onPointerMove={!full ? event => {
        if (event.pointerType !== 'mouse' || event.buttons) return;
        pointer.current = {x: event.clientX, y: event.clientY};
        inspect();
      } : undefined}
      onPointerLeave={!full ? () => { pointer.current = null; inspect(); } : undefined} {...events}>
      {visible.map(item => (
        <Photo key={item.src} photo={item} full={full || inspectSource === item.src}
          priority={item.src === first.current} onReady={onReady} onFail={onFail}
          state={item.src === layers.shown?.src ? 'current' : item.src === photo.src ? 'pending' : 'leaving'} />
      ))}
      {photo ? children : <p className="product-media-empty" role="status">Photographs unavailable</p>}
    </div>
  );
}

function Thumbnail({photo, onMissing, ...props}) {
  const [missing, setMissing] = useState(false);
  return (
    <button type="button" className="product-media-thumb" {...props}>
      <img src={missing ? photo.src : photo.thumb || photo.src} width={photo.width} height={photo.height} alt=""
        loading="lazy" decoding="async" fetchPriority="low" draggable="false"
        onError={() => {
          if (!missing && photo.thumb && photo.thumb !== photo.src) setMissing(true);
          else onMissing(photo.src);
        }} />
    </button>
  );
}

function Navigation({index, count, move}) {
  if (count < 2) return null;
  return (
    <div className="product-media-navigation" role="group" aria-label="Photograph controls">
      <button type="button" aria-label="Previous photograph" onClick={() => move(-1)}>←</button>
      <p className="product-media-count" role="status" aria-label={`Photograph ${index + 1} of ${count}`}>
        {number(index + 1)} <span aria-hidden="true">/</span> {number(count)}
      </p>
      <button type="button" aria-label="Next photograph" onClick={() => move(1)}>→</button>
    </div>
  );
}

function arrowDirection(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return 0;
  return event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
}

function isSwipe(start, end) {
  const dx = end.x - start.x;
  return Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(end.y - start.y) * 1.3;
}

const point = event => ({x: event.clientX, y: event.clientY});
const center = ([a, b]) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
const distance = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);

function Lightbox({name, photo, adjacent, direction, index, count, move, onFail, onClose}) {
  const dialog = useRef(null);
  const close = useRef(null);
  const stage = useRef(null);
  const view = useRef(rest);
  const gesture = useRef(null);
  const pointers = useRef(new Map());
  const [display, setDisplay] = useState(rest);
  const [zoomMax, setZoomMax] = useState(1);

  useLayoutEffect(() => {
    const node = dialog.current;
    node.showModal();
    close.current.focus({preventScroll: true});
    return () => { if (node.open) node.close(); };
  }, []);

  function show(next) {
    view.current = next;
    setDisplay(next);
  }

  useLayoutEffect(() => {
    const node = stage.current;
    function measure() {
      setZoomMax(photo ? clamp(1 / imageFit(node, photo).fit, 1, 3) : 1);
      show(rest);
    }
    pointers.current.clear();
    gesture.current = null;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [photo]);

  function position(scale, x, y, bounds) {
    if (scale <= 1) { show(rest); return; }
    const xLimit = Math.max(0, (bounds.imageWidth * scale - bounds.width) / 2);
    const yLimit = Math.max(0, (bounds.imageHeight * scale - bounds.height) / 2);
    show({scale, x: clamp(x, -xLimit, xLimit), y: clamp(y, -yLimit, yLimit)});
  }

  function zoom(scale, anchor, origin = anchor, initial = view.current) {
    if (!photo) return;
    const bounds = imageFit(stage.current, photo);
    const next = clamp(scale, 1, zoomMax);
    const ratio = next / initial.scale;
    const x = anchor ? anchor.x - bounds.left - bounds.width / 2 : 0;
    const y = anchor ? anchor.y - bounds.top - bounds.height / 2 : 0;
    position(next, (initial.x - x) * ratio + x + (origin ? origin.x - anchor.x : 0),
      (initial.y - y) * ratio + y + (origin ? origin.y - anchor.y : 0), bounds);
  }

  function pointerDown(event) {
    if (!photo || event.button !== 0 || (event.pointerType === 'mouse' && view.current.scale === 1)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const here = point(event);
    pointers.current.set(event.pointerId, here);
    if (pointers.current.size === 1) gesture.current = {start: here, initial: view.current};
    if (pointers.current.size === 2) {
      const pair = [...pointers.current.values()];
      gesture.current = {distance: distance(pair), center: center(pair), initial: view.current, pinched: true};
    }
  }

  function pointerMove(event) {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    const here = point(event);
    pointers.current.set(event.pointerId, here);
    if (pointers.current.size === 2 && start.distance > 0) {
      const pair = [...pointers.current.values()];
      zoom(start.initial.scale * distance(pair) / start.distance, start.center, center(pair), start.initial);
    } else if (pointers.current.size === 1 && start.start && view.current.scale > 1) {
      position(view.current.scale, start.initial.x + here.x - start.start.x,
        start.initial.y + here.y - start.start.y, imageFit(stage.current, photo));
    }
  }

  function pointerEnd(event) {
    const start = gesture.current;
    if (!pointers.current.delete(event.pointerId) || !start) return;
    if (pointers.current.size === 1) {
      gesture.current = {start: pointers.current.values().next().value, initial: view.current, pinched: true};
    } else if (!pointers.current.size) {
      gesture.current = null;
      const end = point(event);
      if (event.type === 'pointerup' && !start.pinched && start.initial.scale === 1 && isSwipe(start.start, end)) {
        move(end.x < start.start.x ? 1 : -1);
      }
    }
  }

  function changeZoom(delta) { zoom(view.current.scale + delta); }

  function handleKey(event) {
    const arrow = arrowDirection(event);
    if (arrow && count > 1) { event.preventDefault(); move(arrow); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(.5); }
    if (event.key === '-') { event.preventDefault(); changeZoom(-.5); }
  }

  return (
    <dialog className="product-media-lightbox" aria-label={`${name} photographs`} ref={dialog} onKeyDown={handleKey}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
      <header className="product-media-lightbox-head">
        <p>{name}</p>
        <button type="button" aria-label="Close full-screen photographs" ref={close} onClick={onClose}>Close <span aria-hidden="true">×</span></button>
      </header>
      <PhotoStage photo={photo} adjacent={adjacent} direction={direction} stage={stage} full view={display} onFail={onFail}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
        onDoubleClick={event => zoom(view.current.scale > 1 ? 1 : Math.min(2, zoomMax), point(event))} />
      <footer className="product-media-lightbox-foot">
        <Navigation index={index} count={count} move={move} />
        {zoomMax > 1.01 && <div className="product-media-zoom" role="group" aria-label="Zoom controls">
          <button type="button" aria-label="Zoom out" disabled={display.scale <= 1} onClick={() => changeZoom(-.5)}>−</button>
          <button type="button" aria-label="Zoom in" disabled={display.scale >= zoomMax} onClick={() => changeZoom(.5)}>+</button>
        </div>}
      </footer>
    </dialog>
  );
}

export function ProductMediaGallery({name, media = noMedia, flight = false}) {
  const [missing, setMissing] = useState([]);
  const [selection, select] = useState({src: media?.[0]?.src, direction: 1});
  const [fullscreen, setFullscreen] = useState(false);
  const stage = useRef(null);
  const rail = useRef(null);
  const touchStart = useRef(null);
  const handledTouch = useRef(false);
  const available = useMemo(() => (media ?? noMedia).filter(item => item?.src && !missing.includes(item.src)), [media, missing]);
  const index = Math.max(0, available.findIndex(item => item.src === selection.src));
  const photo = available[index];
  const count = available.length;
  const adjacent = useMemo(() => {
    if (count < 2) return [];
    const next = available[(index + 1) % count];
    return count === 2 ? [next] : [next, available[(index + count - 1) % count]];
  }, [available, count, index]);

  useLayoutEffect(() => {
    const track = rail.current;
    const active = track?.querySelector('[aria-current="true"]');
    if (!active) return;
    const offset = active.offsetLeft;
    const left = Math.max(0, clamp(track.scrollLeft, offset + active.offsetWidth - track.clientWidth + 2, offset - 2));
    if (left !== track.scrollLeft) track.scrollTo({left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }, [photo]);

  function fail(src) {
    setMissing(current => current.includes(src) ? current : [...current, src]);
  }

  function choose(next, direction) {
    if (next !== index && available[next]) select({src: available[next].src, direction});
  }

  function move(direction, focus = false) {
    if (count < 2) return;
    const next = (index + count + direction) % count;
    choose(next, direction);
    if (focus) rail.current?.children[next]?.focus({preventScroll: true});
  }

  function handleKey(event) {
    if (event.defaultPrevented || fullscreen) return;
    const arrow = arrowDirection(event);
    if (arrow && count > 1) {
      event.preventDefault();
      move(arrow, rail.current?.contains(event.target));
    }
  }

  return (
    <section className="product-media" aria-label={`${name} image gallery`} onKeyDown={handleKey}>
      <PhotoStage photo={photo} adjacent={adjacent} direction={selection.direction} stage={stage} flight={flight} onFail={fail}
        onPointerDown={event => {
          handledTouch.current = !event.isPrimary;
          touchStart.current = event.pointerType !== 'mouse' && event.isPrimary ? {id: event.pointerId, ...point(event)} : null;
        }}
        onPointerUp={event => {
          const start = touchStart.current;
          if (start?.id !== event.pointerId) return;
          touchStart.current = null;
          handledTouch.current = true;
          const end = point(event);
          if (isSwipe(start, end)) move(end.x < start.x ? 1 : -1);
          else if (Math.hypot(end.x - start.x, end.y - start.y) < 10) setFullscreen(true);
        }}
        onPointerCancel={() => {
          touchStart.current = null;
          handledTouch.current = true;
        }}>
        <button type="button" className="product-media-open" aria-label={`View full-screen photographs of ${name}`} aria-haspopup="dialog"
          onClick={event => {
            if (!handledTouch.current || event.detail === 0) setFullscreen(true);
            handledTouch.current = false;
          }}>
          <span aria-hidden="true">↗</span>
        </button>
      </PhotoStage>
      {count > 1 && <div className="product-media-tray">
        <div className="product-media-rail" role="group" aria-label="Photograph thumbnails" ref={rail}>
          {available.map((item, at) => <Thumbnail key={item.src} photo={item} onMissing={fail}
            aria-label={`Photograph ${at + 1}: ${item.alt}`} aria-current={at === index ? 'true' : undefined}
            tabIndex={at === index ? 0 : -1} onClick={() => choose(at, Math.sign(at - index))} />)}
        </div>
        <Navigation index={index} count={count} move={move} />
      </div>}
      {fullscreen && <Lightbox name={name} photo={photo} adjacent={adjacent} direction={selection.direction}
        index={index} count={count} move={move} onFail={fail} onClose={() => setFullscreen(false)} />}
    </section>
  );
}
