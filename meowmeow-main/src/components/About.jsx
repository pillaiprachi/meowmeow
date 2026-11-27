import {useEffect, useRef, useState} from 'react';

export function About() {
  const video = useRef(null);
  const started = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const film = video.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) film.pause();
      else if (entry.intersectionRatio >= .35 && !started.current && !reduced.matches) {
        started.current = true;
        film.play().catch(() => {});
      }
    }, {threshold: .35});
    observer.observe(film);
    return () => observer.disconnect();
  }, []);

  function toggleFilm() {
    const film = video.current;
    started.current = true;
    if (film.paused) {
      setShowControls(true);
      film.play().catch(() => {});
    } else film.pause();
  }

  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <h2 className="about-headline" id="about-title"><span>A TIE</span> <span className="about-headline-middle">is more</span> <span className="about-headline-end"><span>THAN AN</span> <span>ACCESSORY.</span></span></h2>
      <div className="about-spread">
        <figure className="about-film">
          <video id="about-film" ref={video} aria-label="The First Chapter film" controls={showControls} muted loop playsInline preload="none"
            poster="/about-assets/first-chapter-poster.webp" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
            <source src="/about-assets/first-chapter.mp4" type="video/mp4" />
          </video>
          <figcaption>
            <button className="about-film-toggle" type="button" aria-controls="about-film" aria-label={`${playing ? 'Pause' : 'Play'} The First Chapter film`} onClick={toggleFilm}>
              <span>THE FIRST CHAPTER</span> <span>FILM</span>
            </button>
          </figcaption>
        </figure>
        <div className="about-story">
          <h3>CURVA exists between<br className="about-story-break" /> sport, culture and design.</h3>
          <div className="about-copy">
            <p>Each release begins with an archival reference, reinterpreted through a contemporary lens. A single image — a run, a touch, a moment of balance — is handpainted, printed on silk, and produced in limited numbers only.</p>
            <p>Created with intention. Made meaningful by those who wear it.</p>
          </div>
        </div>
        <img className="about-portraits" src="/about-assets/first-chapter-portraits.webp" width="640" height="640" alt="Two campaign portraits featuring Il Ritmo and Il Controllo silk ties" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}
