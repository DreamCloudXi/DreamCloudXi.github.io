/**
 * Background video.
 *
 * The markup ships without source URLs so the poster is what the browser paints
 * first — a hero video that starts downloading during layout becomes the
 * largest contentful paint and drags it out by seconds on a phone.
 *
 * Sources are attached once the page is idle, and never for a reader who has
 * asked for reduced motion: an autoplaying loop is exactly the kind of movement
 * that preference is about, and the poster stands in for it.
 */
export function initBackgroundVideo(): void {
  const videos = document.querySelectorAll<HTMLVideoElement>('[data-bg-video]');
  if (!videos.length) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)');

  /*
   * Phones keep the poster. The video is the largest thing on the page by an
   * order of magnitude, so on a small screen it becomes the largest contentful
   * paint and costs seconds — and megabytes of someone's data — for decoration
   * behind a headline. Raise or remove this query to play it everywhere.
   */
  const small = matchMedia('(max-width: 767px)');
  const frugal = 'connection' in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

  const attach = (video: HTMLVideoElement) => {
    if (video.dataset.loaded) return;
    const sources = video.querySelectorAll<HTMLSourceElement>('source[data-src]');
    if (!sources.length) return;

    video.dataset.loaded = 'true';
    for (const source of sources) {
      source.src = source.dataset.src ?? '';
      source.removeAttribute('data-src');
    }
    video.load();
    // Autoplay can be refused; the poster remains, which is the point of it.
    void video.play().catch(() => {});
  };

  /** Only spend the bytes on a video the reader can actually see. */
  const watch = (video: HTMLVideoElement) => {
    if (still.matches || small.matches || frugal) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          attach(video);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(video);
  };

  const start = () => {
    for (const video of videos) watch(video);
  };

  // After first paint, so the poster wins the contentful-paint race.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2000 });
  } else {
    setTimeout(start, 200);
  }

  // A reader who turns the preference off, or widens the window, gets the video.
  still.addEventListener('change', (event) => {
    if (!event.matches) start();
  });
  small.addEventListener('change', (event) => {
    if (!event.matches) start();
  });
}

/**
 * The play/pause button on a video that does not start by itself. The video
 * waits for a click, plays through once, and the button shows the action it
 * will take next: the play glyph while stopped, the pause glyph while playing.
 */
export function initVideoControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-w-bg-video-control]')) {
    const video = document.getElementById(button.getAttribute('aria-controls') ?? '');
    if (!(video instanceof HTMLVideoElement)) continue;

    const playing = button.querySelector<HTMLElement>('.video-state.play');
    const stopped = button.querySelector<HTMLElement>('.video-state.pause');

    const sync = () => {
      const running = !video.paused && !video.ended;
      if (playing) playing.hidden = !running;
      if (stopped) stopped.hidden = running;
      button.setAttribute('aria-label', running ? 'Pause video' : 'Play video');
    };

    button.addEventListener('click', () => {
      if (video.paused || video.ended) void video.play().catch(() => {});
      else video.pause();
    });

    for (const type of ['play', 'pause', 'ended']) video.addEventListener(type, sync);
    sync();
  }
}
