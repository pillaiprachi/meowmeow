import {useCallback, useLayoutEffect, useState} from 'react';
import {CurvaPreloader} from '../components/preloader/CurvaPreloader';
import {About} from '../components/About';
import {CampaignTeaser} from '../components/CampaignTeaser';
import {Hero} from '../components/Hero';
import {Lookbook} from '../components/Lookbook';
import {Rack} from '../components/Rack';
import {TieHelix} from '../components/TieHelix';

function Intro() {
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(document.readyState === 'complete');
  const finish = useCallback(() => setActive(false), []);

  useLayoutEffect(() => {
    if (!active) return;
    const listeners = new AbortController();
    const {signal} = listeners;
    const loaded = () => setReady(true);
    if (document.readyState === 'complete') loaded();
    else window.addEventListener('load', loaded, {signal, once: true});
    const deadline = setTimeout(finish, 8500);
    window.addEventListener('keydown', event => {
      if (event.key === 'Tab' || event.key === 'Escape') finish();
    }, {signal});
    return () => {
      clearTimeout(deadline);
      listeners.abort();
    };
  }, [active, finish]);

  return active && <CurvaPreloader ready={ready} onComplete={finish} />;
}

export function Home() {
  return (
    <>
      <Intro />
      <main>
        <Hero />
        <TieHelix />
        <Rack />
        <CampaignTeaser />
        <About />
        <Lookbook />
      </main>
    </>
  );
}