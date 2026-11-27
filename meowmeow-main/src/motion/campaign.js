export function mountCampaign(campaign, {revealOutside = false, progressBar} = {}) {
  const listeners = new AbortController();
  const {signal} = listeners;

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  if (!('IntersectionObserver' in window)) return () => listeners.abort();

  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !motion.matches) continue;
      entry.target.classList.add('campaign-revealed');
      reveal.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px 8% 0px' });

  const visibleFrames = new Set();
  let frame = 0;

  function updateMotion() {
    frame = 0;
    const viewport = window.innerHeight;
    const travels = [];
    for (const element of visibleFrames) {
      const bounds = element.getBoundingClientRect();
      const travel = (viewport - bounds.top * 2 - bounds.height) / (viewport + bounds.height);
      travels.push([element, Math.max(-1, Math.min(1, travel))]);
    }
    const pageHeight = document.documentElement.scrollHeight - viewport;
    for (const [element, travel] of travels) {
      element.style.setProperty('--travel', travel.toFixed(4));
    }
    if (progressBar) progressBar.style.setProperty('--page-progress', pageHeight > 0 ? scrollY / pageHeight : 0);
  }

  function scheduleMotion() {
    if (motion.matches && (progressBar || visibleFrames.size) && !frame) {
      frame = requestAnimationFrame(updateMotion);
    }
  }

  const parallax = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleFrames.add(entry.target);
      else visibleFrames.delete(entry.target);
    }
    scheduleMotion();
  }, { rootMargin: '8% 0px' });

  function syncMotion() {
    const enabled = motion.matches;
    campaign.classList.toggle('campaign-motion', enabled);
    if (progressBar) progressBar.hidden = !enabled;
    if (enabled) {
      (revealOutside ? document : campaign).querySelectorAll('[data-reveal]:not(.campaign-revealed)').forEach(node => reveal.observe(node));
      campaign.querySelectorAll('.campaign-frame:not(.campaign-feature-media), .campaign-feature').forEach(node => parallax.observe(node));
      scheduleMotion();
      return;
    }
    reveal.disconnect();
    parallax.disconnect();
    visibleFrames.clear();
    cancelAnimationFrame(frame);
    frame = 0;
  }

  window.addEventListener('scroll', scheduleMotion, {passive: true, signal});
  window.addEventListener('resize', scheduleMotion, {signal});
  motion.addEventListener('change', syncMotion, {signal});
  syncMotion();
  return () => {
    listeners.abort();
    reveal.disconnect();
    parallax.disconnect();
    cancelAnimationFrame(frame);
  };
}
