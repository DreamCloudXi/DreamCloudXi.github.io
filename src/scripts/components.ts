/**
 * Small interactive components: tabs, accordions, the slider, the newsletter
 * form, and smooth scrolling to in-page anchors.
 *
 * Each one enhances markup that already works without JavaScript.
 */

/* ------------------------------------------------------------------ tabs -- */

export function initTabs(): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
    const tabs = [...group.querySelectorAll<HTMLElement>('[data-tab]')];
    const panes = [...group.querySelectorAll<HTMLElement>('[data-tab-pane]')];
    const indicator = group.querySelector<HTMLElement>('[data-tab-indicator]');
    if (!tabs.length) continue;

    const select = (index: number) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle('is-current', active);
      });
      panes.forEach((pane, i) => pane.toggleAttribute('data-active', i === index));
      if (indicator) indicator.style.transform = `translateX(${index * 100}%)`;
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (event) => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = (i + delta + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });

    select(0);
  }
}

/* ------------------------------------------------------------- accordion -- */

export function initAccordions(): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-accordion]')) {
    const items = [...group.querySelectorAll<HTMLElement>('[data-accordion-item]')];
    /** Only one panel stays open at a time, matching the source design. */
    const single = group.dataset.accordion !== 'multiple';

    for (const item of items) {
      const trigger = item.querySelector<HTMLButtonElement>('[data-accordion-trigger]');
      const panel = item.querySelector<HTMLElement>('[data-accordion-panel]');
      if (!trigger || !panel) continue;

      trigger.addEventListener('click', () => {
        const open = item.hasAttribute('data-open');
        if (single) {
          for (const other of items) {
            other.removeAttribute('data-open');
            other.querySelector('[data-accordion-trigger]')?.setAttribute('aria-expanded', 'false');
          }
        }
        item.toggleAttribute('data-open', !open);
        trigger.setAttribute('aria-expanded', String(!open));
      });
    }
  }
}

/* ------------------------------------------------------------ pagination -- */

/**
 * Back and next without a reload. The controls stay ordinary links — with no
 * script they simply load the next page — but a click fetches that page and
 * swaps only the paginated list into place, updating the address bar and title
 * to match and bringing the top of the list back into view. The browser's own
 * back and forward buttons walk through the same pages.
 */
export function initPagination(): void {
  const region = document.querySelector<HTMLElement>('[data-paginated]');
  if (!region) return;

  const load = async (url: string, push: boolean) => {
    const current = document.querySelector<HTMLElement>('[data-paginated]');
    if (!current) return;

    current.setAttribute('data-loading', '');
    try {
      const response = await fetch(url, { headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error(String(response.status));
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const next = doc.querySelector<HTMLElement>('[data-paginated]');
      if (!next) throw new Error('no list');

      current.innerHTML = next.innerHTML;
      // Anything with a reveal is shown at once: it is already on screen.
      for (const el of current.querySelectorAll('[data-anim]')) el.setAttribute('data-anim-ready', '');
      document.title = doc.title;
      if (push) history.pushState({ paginated: true }, '', url);

      const top = current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } catch {
      // Anything unexpected: fall back to a normal page load.
      window.location.href = url;
    } finally {
      current.removeAttribute('data-loading');
    }
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-paginated] .pagination a');
    if (!link) return;
    event.preventDefault();
    void load(link.href, true);
  });

  window.addEventListener('popstate', () => void load(location.href, false));
}

/* ------------------------------------------------------- category dropdown -- */

/** The shop's "All Categories" list: hover or click to open, and it closes again. */
export function initCategoryDropdown(): void {
  for (const menu of document.querySelectorAll<HTMLElement>('[data-category-dropdown]')) {
    const toggle = menu.querySelector<HTMLElement>('[data-category-toggle]');
    if (!toggle) continue;

    const set = (open: boolean) => {
      menu.toggleAttribute('data-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    // A mouse opens it by hovering; a finger has no hover, so it taps instead.
    menu.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') set(true);
    });
    menu.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') set(false);
    });

    toggle.addEventListener('click', () => set(!menu.hasAttribute('data-open')));
    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        set(!menu.hasAttribute('data-open'));
      }
    });

    menu.addEventListener('focusout', (event) => {
      if (!menu.contains(event.relatedTarget as Node | null)) set(false);
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target as Node)) set(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') set(false);
    });
  }
}

/* ---------------------------------------------------------------- slider -- */

export function initSliders(): void {
  for (const slider of document.querySelectorAll<HTMLElement>('[data-slider]')) {
    const mask = slider.querySelector<HTMLElement>('[data-slider-mask]');
    const slides = [...slider.querySelectorAll<HTMLElement>('[data-slide]')];
    const prev = slider.querySelector<HTMLButtonElement>('[data-slider-prev]');
    const next = slider.querySelector<HTMLButtonElement>('[data-slider-next]');
    const dots = [...slider.querySelectorAll<HTMLButtonElement>('[data-slider-dot]')];
    if (!mask || slides.length < 2) continue;

    if (slider.hasAttribute('data-slider-infinite')) {
      initLoopingSlider(mask, slides, prev, next);
      continue;
    }

    const goTo = (index: number) => {
      const clamped = Math.max(0, Math.min(index, slides.length - 1));
      mask.scrollTo({ left: slides[clamped].offsetLeft - mask.offsetLeft });
    };

    /** Which slide currently fills the mask. */
    const current = () => {
      const center = mask.scrollLeft + mask.clientWidth / 2;
      return slides.findIndex(
        (slide) => slide.offsetLeft <= center && slide.offsetLeft + slide.clientWidth > center
      );
    };

    prev?.addEventListener('click', () => goTo(current() - 1));
    next?.addEventListener('click', () => goTo(current() + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    const sync = () => {
      const index = current();
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-current', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= slides.length - 1;
    };

    mask.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    sync();
  }
}

/**
 * A slider that loops, as the design's does: each arrow moves every slide one
 * place, and the one that leaves on one side comes round to the other. The mask
 * does not scroll — it is left at its natural width and the slides are shifted
 * with transforms, so the neighbours show beside the current slide.
 */
function initLoopingSlider(
  mask: HTMLElement,
  slides: HTMLElement[],
  prev: HTMLButtonElement | null,
  next: HTMLButtonElement | null
): void {
  const count = slides.length;
  const duration = 500;
  /** Where each slide sits, in slide widths from its natural place. */
  const place = slides.map((_, i) => i);
  let busy = false;

  const apply = (animate: boolean) => {
    // One place is the distance between neighbours, which is wider than a slide
    // wherever the slides are separated by a margin.
    const pitch = slides[1].offsetLeft - slides[0].offsetLeft;
    slides.forEach((slide, i) => {
      slide.style.transition = animate ? `transform ${duration}ms ease` : 'none';
      slide.style.transform = `translateX(${(place[i] - i) * pitch}px)`;
    });
  };

  const step = (direction: 1 | -1) => {
    if (busy) return;
    busy = true;

    if (direction === 1) {
      // The first slide leaves on the left; afterwards it rejoins at the far end.
      const first = place.indexOf(Math.min(...place));
      place.forEach((_, i) => (place[i] -= 1));
      apply(true);
      setTimeout(() => {
        place[first] += count;
        apply(false);
        busy = false;
      }, duration);
    } else {
      // The last slide is parked just before the first, then everything moves up.
      const last = place.indexOf(Math.max(...place));
      place[last] -= count;
      apply(false);
      void mask.offsetWidth; // Commit the parked position before animating.
      place.forEach((_, i) => (place[i] += 1));
      apply(true);
      setTimeout(() => (busy = false), duration);
    }
  };

  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));

  // A horizontal swipe does what the arrows do.
  let startX = 0;
  mask.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
  mask.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
}

/* ------------------------------------------------------------------ form -- */

/**
 * Posts the newsletter form to whatever endpoint the markup names, and shows
 * the success or error message in place. With no endpoint configured the form
 * still validates and reports success, so the demo behaves sensibly.
 */
export function initForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-newsletter], [data-contact-form]')) {
    const scope = form.closest('div') ?? form.parentElement!;
    const success = scope.querySelector<HTMLElement>('[data-newsletter-success], [data-form-success]');
    const failure = scope.querySelector<HTMLElement>('[data-newsletter-error], [data-form-error]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      success?.setAttribute('hidden', '');
      failure?.setAttribute('hidden', '');

      const endpoint = form.getAttribute('action');
      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const label = submit?.textContent;
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Please wait…';
      }

      try {
        if (endpoint) {
          const response = await fetch(endpoint, {
            method: form.getAttribute('method') ?? 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        }
        form.reset();
        form.hidden = true;
        success?.removeAttribute('hidden');
      } catch {
        failure?.removeAttribute('hidden');
      } finally {
        if (submit) {
          submit.disabled = false;
          if (label) submit.textContent = label;
        }
      }
    });
  }
}

/* --------------------------------------------------------- anchor scroll -- */

export function initAnchors(): void {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href')!.slice(1);
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Keep the keyboard in step with the visual jump.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ----------------------------------------------------------- team social -- */

/**
 * The row of links behind a maker's portrait.
 *
 * Hover opens it for a pointer, which is what the design does; the plus is for
 * everyone else. The links are in the markup either way, so nothing here is
 * load-bearing for reaching them.
 */
export function initTeamSocial(): void {
  for (const toggle of document.querySelectorAll<HTMLButtonElement>('[data-team-social-toggle]')) {
    const row = toggle.closest<HTMLElement>('[data-team-social]');
    if (!row) continue;

    toggle.addEventListener('click', () => {
      const open = row.hasAttribute('data-open');
      row.toggleAttribute('data-open', !open);
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }
}
