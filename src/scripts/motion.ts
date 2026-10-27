/**
 * Motion layer.
 *
 * Everything here is driven by `data-anim` attributes in the markup, so a page
 * declares what it wants and this file decides how it moves. To slow the whole
 * site down, retime it, or switch an effect off, edit `EFFECTS` below — nothing
 * else needs to change.
 *
 * Hover states are deliberately *not* here; they live in `styles/behavior.css`
 * as CSS transitions, which is cheaper and works before this script loads.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/*
 * Every reveal in this design starts as the element crosses the bottom of the
 * viewport rather than part-way up it — the export's own `start: top bottom`.
 * Each effect states it rather than sharing a constant, because two of them
 * scrub against a range and read better with both ends written out together.
 */

type Effect = (el: HTMLElement, options: Options) => void;

interface Options {
  delay: number;
  duration: number;
  /** Per-effect argument, e.g. the marquee's cycle length. */
  value: string | null;
}

/* ---------------------------------------------------------------- effects -- */

const EFFECTS: Record<string, Effect> = {
  /*
   * The page's opening block. Everything carrying it moves together on load,
   * each element a fifth of a second behind the one before — the export
   * staggers by 0.2s across the whole `[hero-animation]` set rather than per
   * container, which is why this runs as one timeline rather than per element.
   */
  hero: () => {},

  /**
   * A heading, revealed a line at a time from behind its own baseline.
   *
   * `SplitText` with a line mask is what makes the letters appear to rise out
   * of the text rather than over it. The export splits on lines, not words —
   * splitting finer reads as a ripple and loses the weight of the phrase.
   */
  'text-lines': (el) => {
    /*
     * The line and mask classes are the ones the export's own SplitText call
     * produces. Both sides run the same library, so naming them the same way
     * keeps the two element trees comparable — without it every split heading
     * reads as a block the theme is missing.
     */
    const split = new SplitText(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'gsap_split_line gsap_split_line++',
    });
    gsap.from(split.lines, {
      yPercent: 100,
      opacity: 0,
      duration: 0.6,
      delay: 0.1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  },

  /** A card in a grid: rises, fades and settles out of a slight shrink. */
  card: (el) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      scale: 0.75,
      duration: 1,
      delay: 0.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  },

  /**
   * A photograph settling back to its own size out of a slow push-in. No
   * opacity in this one — the image is visible the whole way, which is why it
   * is exempt from the reveal that hides the others until the layer is ready.
   */
  'image-zoom': (el) => {
    gsap.from(el, {
      scale: 1.5,
      duration: 1,
      delay: 0.4,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  },

  /**
   * The photo gallery: every cell fades in on its own as it reaches the bottom
   * of the window. The block carries the effect and the cells are what move, so
   * a cell far down the page waits its turn rather than all showing at once.
   * Opacity only, held back 0.4s after the cell crosses the edge.
   */
  gallery: (el) => {
    for (const cell of el.children) {
      gsap.from(cell, {
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: cell, start: 'top bottom', once: true },
      });
    }
  },

  /** The plainest reveal in the design: opacity, nothing else. */
  fade: (el) => {
    gsap.from(el, {
      opacity: 0,
      duration: 0.6,
      delay: 0.4,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  },

  /*
   * The "why buy handmade" panel. Its cards are dragged up through 150px as
   * the section crosses the viewport — scrubbed, so the movement belongs to the
   * scroll rather than running on its own. Below 992px the export turns this
   * off and plays `choose-item` instead, which is a reveal rather than a
   * parallax: the travel that reads as depth on a wide screen reads as a jump
   * on a narrow one.
   */
  choose: (el) => {
    if (!matchMedia('(min-width: 992px)').matches) return;
    gsap.from(el.querySelectorAll('[data-anim="choose-item"]'), {
      y: 150,
      duration: 0.6,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: '10% bottom',
        end: 'bottom 60%',
        scrub: 0.8,
      },
    });
  },

  /** The same cards below 992px, where the scrubbed version is switched off. */
  'choose-item': (el) => {
    if (matchMedia('(min-width: 992px)').matches) return;
    gsap.from(el, {
      y: 50,
      opacity: 0,
      scale: 0.75,
      duration: 0.6,
      delay: 0.2,
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  },
};

/**
 * The hero, as one timeline.
 *
 * Every `[data-anim="hero"]` element on the page moves together when it loads,
 * 0.2s apart in document order. Running it per element would restart the
 * stagger inside each container and lose the cascade down the page.
 */
function initHero(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-anim="hero"]');
  if (!elements.length) return;
  gsap.from(elements, {
    y: 50,
    opacity: 0,
    duration: 0.6,
    stagger: 0.2,
    ease: 'power3.out',
  });
}

/* ------------------------------------------------------- cursor parallax -- */

/**
 * Artwork that drifts with the pointer inside its card. Skipped on touch
 * devices, where there is no pointer to follow.
 */
function initCursorParallax(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  for (const area of document.querySelectorAll<HTMLElement>('[data-cursor-parallax]')) {
    const target = area.querySelector<HTMLElement>('[data-cursor-parallax-target]');
    if (!target) return;

    const range = Number(area.dataset.cursorParallax) || 50;
    const moveX = gsap.quickTo(target, 'x', { duration: 0.6, ease: 'power3.out' });
    const moveY = gsap.quickTo(target, 'y', { duration: 0.6, ease: 'power3.out' });

    area.addEventListener('pointermove', (event) => {
      const box = area.getBoundingClientRect();
      moveX(((event.clientX - box.left) / box.width - 0.5) * range * 2);
      moveY(((event.clientY - box.top) / box.height - 0.5) * range * 2);
    });

    area.addEventListener('pointerleave', () => {
      moveX(0);
      moveY(0);
    });
  }
}

/**
 * The home hero's image trail: as the pointer travels, pictures from the list
 * pop in at its position, then fade and drift down. One is spawned each time
 * the pointer has moved more than 100px from where the last one appeared.
 *
 * The clone template lives in a hidden block, the images to cycle through in a
 * hidden list — the same arrangement as the export, so the markup is unchanged.
 */
function initImageTrail(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  for (const area of document.querySelectorAll<HTMLElement>('.home-gsap')) {
    const stage = area.querySelector<HTMLElement>('.gsap-wrapper');
    const template = area.querySelector<HTMLElement>('.gsap-wrap');
    const sources = [...area.querySelectorAll<HTMLImageElement>('.gsap-item img')].map(
      (img) => img.currentSrc || img.src,
    );
    if (!stage || !template || sources.length === 0) continue;

    let index = -1;
    let lastX = 0;
    let lastY = 0;

    area.addEventListener('mousemove', (event) => {
      if (Math.abs(lastX - event.pageX) <= 100 && Math.abs(lastY - event.pageY) <= 100) return;
      lastX = event.pageX;
      lastY = event.pageY;

      index = (index + 1) % sources.length;
      const wrap = template.cloneNode(true) as HTMLElement;
      const img = wrap.querySelector('img')!;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.loading = 'eager';
      img.src = sources[index]!;
      stage.appendChild(wrap);

      const tl = gsap.timeline({ onComplete: () => wrap.remove() });
      tl.set(wrap, { x: lastX, y: lastY - window.scrollY });
      tl.fromTo(wrap, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, ease: 'power1.out' });
      tl.to(img, { opacity: 0, y: '8rem', duration: 1 });
    });
  }
}

/**
 * "Our Works": a section pinned for four screens' worth of scrolling while its
 * heading, its counter and its photographs change over.
 *
 * Each of the three changes is a short scrubbed move — a quarter of a screen's
 * scroll long — that starts a little after the last one ends, 1.25 screens
 * apart: the heading and the counter each step up one line, and the top
 * photograph slides off to the left to uncover the next. The moves are linear
 * in the scroll position, so the page's own scrolling is the only easing.
 *
 * The "View All" button is hidden until the pointer is over the section, then
 * grows in and trails the cursor.
 */
function initWorks(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.works-height')) {
    const titles = section.querySelector<HTMLElement>('.works-title-wrap');
    const titleBlock = section.querySelector<HTMLElement>('.works-title-block');
    const numbers = section.querySelector<HTMLElement>('.values-num');
    const numberBlock = section.querySelector<HTMLElement>('.values-num-wrap');
    const photos = [...section.querySelectorAll<HTMLElement>('.works-thumb-wrap')].slice(0, -1);
    if (!titles || !titleBlock || !numbers || !numberBlock) continue;

    let top = 0;
    let vh = 0;
    let ticking = false;

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      vh = window.innerHeight;
    };

    const update = () => {
      ticking = false;
      const distance = window.scrollY - top;
      let done = 0;
      photos.forEach((photo, i) => {
        const start = (0.03 + 1.25 * i) * vh;
        const t = Math.min(1, Math.max(0, (distance - start) / (0.25 * vh)));
        gsap.set(photo, { xPercent: -100 * t });
        done += t;
      });
      gsap.set(titles, { y: -done * titleBlock.offsetHeight });
      gsap.set(numbers, { y: -done * numberBlock.offsetHeight });
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      schedule();
    });
    window.addEventListener('load', () => {
      measure();
      schedule();
    });

    const link = section.querySelector<HTMLElement>('.works-button-block');
    const button = link?.firstElementChild as HTMLElement | null;
    if (!link || !button || !matchMedia('(hover: hover) and (pointer: fine)').matches) continue;

    gsap.set(button, { scale: 0.5, opacity: 0 });
    const moveX = gsap.quickTo(button, 'x', { duration: 0.8, ease: 'power3.out' });
    const moveY = gsap.quickTo(button, 'y', { duration: 0.8, ease: 'power3.out' });

    link.addEventListener('pointerenter', () => {
      gsap.to(button, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });
    link.addEventListener('pointermove', (event) => {
      const box = link.getBoundingClientRect();
      moveX(event.clientX - (box.left + box.width / 2));
      moveY(event.clientY - (box.top + box.height / 2));
    });
    link.addEventListener('pointerleave', () => {
      gsap.to(button, { scale: 0.5, opacity: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    });
  }
}

/**
 * "Testimonials": from 992px up the cards sit in a row that is pinned while it
 * slides sideways as the reader scrolls. It starts 350px to the right of where
 * it settles; how far it travels depends on how much of the row the layout can
 * show — a wide screen fits all four cards and ends at rest, narrower ones end
 * further left so the last card comes into view.
 *
 * The move is linear in the scroll position. Its start and end are read off the
 * design: they slide with the height of the window, the start rising and the end
 * falling the taller it is (`START` and `END` are scroll distances from the top
 * of the section for a window height of zero, less that fraction of the height).
 */
const REVIEW_START = { base: 582, perHeight: 0.695 };
const REVIEW_END = { base: 1319, perHeight: 0.305 };
const REVIEW_FROM = 350;
const REVIEW_TO: Record<string, number> = { large: 0, medium: -500, laptop: -650 };

function initReviews(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.review-height')) {
    const rows = [...section.querySelectorAll<HTMLElement>('.review-card-block')];
    if (rows.length === 0) continue;

    let top = 0;
    let ticking = false;

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const start = REVIEW_START.base - REVIEW_START.perHeight * vh;
      const end = REVIEW_END.base - REVIEW_END.perHeight * vh;
      const t = Math.min(1, Math.max(0, (window.scrollY - top - start) / (end - start)));

      for (const row of rows) {
        // Only the row for the current width is displayed; the others stay put.
        if (getComputedStyle(row).display === 'none') continue;
        const size = /is-display-show-for-(large|medium|laptop)/.exec(row.className)?.[1];
        if (!size) continue;
        gsap.set(row, { x: REVIEW_FROM + t * (REVIEW_TO[size]! - REVIEW_FROM) });
      }
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      schedule();
    });
    window.addEventListener('load', () => {
      measure();
      schedule();
    });
  }
}

/**
 * The full-bleed photograph on the About page, pinned for two and a half
 * screens. As the section scrolls into view the frame around the photograph
 * grows from 65% to the whole screen, in step with the scroll; the photograph
 * itself settles from a 1.5x push-in over the first 30% of a screen's scroll.
 * Both are linear in the scroll position and run from the moment the section's
 * top edge reaches the bottom of the window.
 */
function initBanner(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.banner-height')) {
    const frame = section.querySelector<HTMLElement>('.banner-block');
    const photo = section.querySelector<HTMLElement>('.banner-image');
    if (!frame || !photo) continue;

    let top = 0;
    let ticking = false;

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const seen = window.scrollY - top + vh;
      const p = Math.min(1, Math.max(0, seen / section.offsetHeight));
      const zoom = Math.min(1, Math.max(0, seen / (0.3 * vh)));

      frame.style.width = `${65 + 35 * p}%`;
      frame.style.height = `${65 + 35 * p}vh`;
      gsap.set(photo, { scale: 1.5 - 0.5 * zoom });
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      schedule();
    });
    window.addEventListener('load', () => {
      measure();
      schedule();
    });
  }
}

/**
 * The About page's four-step process: four cards laid out as the faces of a
 * prism, which turns over as the reader scrolls so each face takes its turn at
 * the front. The pinned block stays put while the prism makes three-quarters of
 * a full turn (270°), the last face ending up on top.
 *
 * The turn is linear in the scroll position. Alongside the rotation the prism is
 * pushed back and lifted so the face coming forward always sits where the last
 * one was: `ty` and `tz` are read off the design and are piecewise-linear in the
 * angle, changing slope at 90° and 180°. Where the turn starts and ends depends
 * on the window's height, both sliding earlier the taller the window is.
 */
const PRISM_START = { base: 796, perHeight: 0.595 };
const PRISM_END = { base: 1396, perHeight: 0.295 };

function prismOffsets(angle: number): { ty: number; tz: number } {
  const ty =
    angle <= 90
      ? (-250 / 90) * angle
      : angle <= 180
        ? -250 + (314.5 / 90) * (angle - 90)
        : 64.5 + (185.5 / 90) * (angle - 180);
  const tz = angle <= 180 ? (-500 / 180) * angle : -500 + (250 / 90) * (angle - 180);
  return { ty, tz };
}

function initPrism(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.details-height')) {
    const prism = section.querySelector<HTMLElement>('.details-inner');
    if (!prism) continue;

    let top = 0;
    let ticking = false;

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      ticking = false;
      // Below 992px the prism is replaced by a slider and this block is not shown.
      if (!section.offsetParent) return;

      const vh = window.innerHeight;
      const start = PRISM_START.base - PRISM_START.perHeight * vh;
      const end = PRISM_END.base - PRISM_END.perHeight * vh;
      const p = Math.min(1, Math.max(0, (window.scrollY - top - start) / (end - start)));

      if (p === 0) {
        prism.style.transform = '';
        return;
      }
      const angle = 270 * p;
      const { ty, tz } = prismOffsets(angle);
      prism.style.transform = `translate3d(0px, ${ty}px, ${tz}px) rotateX(${angle}deg)`;
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      schedule();
    });
    window.addEventListener('load', () => {
      measure();
      schedule();
    });
  }
}

/**
 * The delivery process: three cards in a row that start stacked on the first
 * one. As the row scrolls up the screen the second and third slide out to the
 * right into their places, the third travelling twice as far. The slide is
 * linear in the scroll position and starts when the row's top edge reaches
 * `0.8 * window height - 63px` from the top of the window, finishing at
 * `0.5 * window height - 154px` — numbers read off the design. Below 992px the
 * cards are a slider instead and the row is not shown.
 */
function initProcessCards(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.process-card-block:not(.is-home)')) {
    const cards = [...row.children] as HTMLElement[];
    if (cards.length < 2) continue;

    let ticking = false;

    const update = () => {
      ticking = false;
      if (!row.getClientRects().length) return;

      const vh = window.innerHeight;
      const startAt = 0.8 * vh - 63;
      const endAt = 0.5 * vh - 154;
      const top = row.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (startAt - top) / (startAt - endAt)));

      // One step is the distance between neighbouring cards, gap included.
      const step = cards[1].offsetLeft - cards[0].offsetLeft;
      cards.forEach((card, i) => {
        if (i === 0) return;
        gsap.set(card, { x: -i * step * (1 - p) });
      });
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
  }
}

/**
 * The round gift-card badge is hidden until the pointer is over the card
 * window, then fades in and trails the cursor, sliding a little short of it
 * (about 96% of the way) and settling in under half a second. Leaving the
 * window fades it out and sends it home to the middle.
 */
function followCursor(section: HTMLElement): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const area = section.querySelector<HTMLElement>('.gift-card-card-block');
  const badge = section.querySelector<HTMLElement>('.gift-card-link');
  if (!area || !badge) return;

  gsap.set(badge, { opacity: 0 });
  const moveX = gsap.quickTo(badge, 'x', { duration: 0.4, ease: 'power3.out' });
  const moveY = gsap.quickTo(badge, 'y', { duration: 0.4, ease: 'power3.out' });
  const REACH = 0.955;

  area.addEventListener('pointerenter', () => {
    gsap.to(badge, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  });
  area.addEventListener('pointermove', (event) => {
    const box = area.getBoundingClientRect();
    moveX((event.clientX - (box.left + box.width / 2)) * REACH);
    moveY((event.clientY - (box.top + box.height / 2)) * REACH);
  });
  area.addEventListener('pointerleave', () => {
    gsap.to(badge, { opacity: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    moveX(0);
    moveY(0);
  });
}

/**
 * The gift card reel: a card-sized window pinned for four screens' worth of
 * scrolling, over a strip of cards side by side. Each change is a short move a
 * quarter of a window tall that slides the strip left by one card width,
 * starting a little after the last one ends — 1.25 windows apart — so the
 * reader lands on each card in turn. Linear in the scroll position, exactly as
 * the "Our Works" section's own steps.
 */
function initGiftCards(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.gift-card-height')) {
    const strip = section.querySelector<HTMLElement>('.gift-card-card');
    const cards = strip ? [...strip.children] : [];
    if (!strip || cards.length < 2) continue;

    // The "01 -04" counter under the card steps up one line per card.
    const counter = section.querySelector<HTMLElement>('.gift-card-num');
    const counterWindow = section.querySelector<HTMLElement>('.gift-card-num-wrap');

    followCursor(section);

    let top = 0;
    let ticking = false;

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
    };

    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const distance = window.scrollY - top;
      let done = 0;
      for (let i = 0; i < cards.length - 1; i++) {
        const start = (0.03 + 1.25 * i) * vh;
        done += Math.min(1, Math.max(0, (distance - start) / (0.25 * vh)));
      }
      gsap.set(strip, { x: -done * (cards[0] as HTMLElement).offsetWidth });
      if (counter && counterWindow) gsap.set(counter, { y: -done * counterWindow.offsetHeight });
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      schedule();
    });
    window.addEventListener('load', () => {
      measure();
      schedule();
    });
  }
}

/**
 * The gift card page's four benefit cards. They are laid out on a staircase —
 * each one a column right of the last and a row down — but they start piled on
 * the first card and walk down the staircase one step at a time as the block
 * scrolls up the screen: the second travels one step, the third two, the fourth
 * three (the last one turning back left). Every step takes the same stretch of
 * scrolling and the walk is linear in the scroll position.
 *
 * Where it starts and how long a step lasts depend on the window's height, and
 * both are read off the design: with the block's top edge `y` below the top of
 * the window, the walk starts at `y = 0.805 * height - 234` and each step lasts
 * `0.135 * height + 155` pixels of scrolling. Below 992px the cards are a slider
 * and this block is not shown.
 */
function initStaircase(): void {
  for (const block of document.querySelectorAll<HTMLElement>('.meaningful-card-block')) {
    const cards = [...block.querySelectorAll<HTMLElement>('.meaningful-card')];
    if (cards.length < 2) continue;

    let ticking = false;

    const update = () => {
      ticking = false;
      if (!block.getClientRects().length) return;

      const vh = window.innerHeight;
      const startAt = 0.805 * vh - 234;
      const step = 0.135 * vh + 155;
      // How many steps of the staircase have been walked so far, 0 to cards - 1.
      const walked = Math.min(
        cards.length - 1,
        Math.max(0, (startAt - block.getBoundingClientRect().top) / step)
      );

      // Where each card naturally sits, which its transform is measured from.
      const slots = cards.map((card) => ({ x: card.offsetLeft, y: card.offsetTop }));

      cards.forEach((card, i) => {
        if (i === 0) return;
        // A card walks only as far as its own slot.
        const t = Math.min(walked, i);
        const from = Math.floor(t);
        const a = slots[from]!;
        const b = slots[Math.min(from + 1, cards.length - 1)]!;
        const x = a.x + (b.x - a.x) * (t - from);
        const y = a.y + (b.y - a.y) * (t - from);
        gsap.set(card, { x: x - slots[i]!.x, y: y - slots[i]!.y });
      });
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
  }
}

/* -------------------------------------------------------------- bootstrap -- */

export function initMotion(): void {
  const elements = [...document.querySelectorAll<HTMLElement>('[data-anim]')];

  // With motion turned down, reveal everything immediately and run nothing else.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of elements) el.setAttribute('data-anim-ready', '');
    return;
  }

  for (const el of elements) {
    const name = el.dataset.anim!;
    const effect = EFFECTS[name];
    el.setAttribute('data-anim-ready', '');

    if (!effect) {
      if (import.meta.env.DEV) console.warn(`[motion] unknown effect "${name}"`, el);
      continue;
    }

    effect(el, {
      delay: Number(el.dataset.animDelay) || 0,
      duration: Number(el.dataset.animDuration) || 0.8,
      value: el.dataset.animValue ?? null,
    });
  }

  initHero();
  initCursorParallax();
  initImageTrail();
  initWorks();
  initReviews();
  initBanner();
  initPrism();
  initProcessCards();
  initGiftCards();
  initStaircase();

  // Late-loading images change the page height; recompute the trigger points.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
