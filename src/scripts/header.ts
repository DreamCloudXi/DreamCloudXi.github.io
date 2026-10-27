/**
 * Header behavior: the mobile menu, the mega-menu dropdowns, and hiding the
 * bar while the reader scrolls down.
 */

const MOBILE = '(max-width: 991px)';

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  initMobileMenu(header);
  initDropdowns(header);
  initScrollHide(header);
}

/* ------------------------------------------------------------ mobile nav -- */

function initMobileMenu(header: HTMLElement): void {
  const toggle = header.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-nav-menu]');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    slideMenu(menu, open);
    // Keep the page behind the overlay still while the menu covers it.
    document.body.style.overflow = open && matchMedia(MOBILE).matches ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Following a link should close the menu it was tapped in.
  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  // Returning to desktop widths must not leave the page scroll-locked.
  matchMedia(MOBILE).addEventListener('change', (event) => {
    if (!event.matches) setOpen(false);
  });
}

/**
 * Slides the overlay in and out, as the design's nav does. `data-open` is kept
 * for the length of the slide out so the menu stays displayed while it leaves.
 */
function slideMenu(menu: HTMLElement, open: boolean): void {
  const inner = menu.querySelector<HTMLElement>('.header-menu');
  menu.removeAttribute('data-closing');
  if (open) {
    menu.toggleAttribute('data-open', true);
    return;
  }
  if (!menu.hasAttribute('data-open')) return;
  menu.toggleAttribute('data-closing', true);
  const finish = () => {
    clearTimeout(timer);
    inner?.removeEventListener('animationend', finish);
    if (menu.hasAttribute('data-closing')) {
      menu.removeAttribute('data-closing');
      menu.removeAttribute('data-open');
    }
  };
  // Fall back in case the animation never runs (reduced motion, hidden tab).
  const timer = window.setTimeout(finish, 450);
  inner?.addEventListener('animationend', finish);
}

/* -------------------------------------------------------------- dropdown -- */

function initDropdowns(header: HTMLElement): void {
  const dropdowns = header.querySelectorAll<HTMLElement>('[data-dropdown]');

  const closeAll = (except?: HTMLElement) => {
    for (const dropdown of dropdowns) {
      if (dropdown !== except) setDropdown(dropdown, false);
    }
  };

  /*
   * Closing is delayed and scoped to the whole nav row rather than the
   * individual dropdown. A mega menu is far wider than the toggle that opens
   * it, so reaching a link on its left or right edge means moving diagonally —
   * briefly leaving the toggle's narrow column while still at header height.
   * Watching only the dropdown would read that as leaving the menu.
   */
  const row = header.querySelector<HTMLElement>('.header-menu-wrap') ?? header;
  let closeTimer: number | undefined;
  const cancelClose = () => clearTimeout(closeTimer);
  const scheduleClose = () => {
    cancelClose();
    closeTimer = window.setTimeout(() => closeAll(), 200);
  };

  row.addEventListener('pointerenter', cancelClose);
  row.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse' || matchMedia(MOBILE).matches) return;
    scheduleClose();
  });

  // Moving onto a plain nav link should dismiss whichever menu is open.
  for (const link of row.querySelectorAll<HTMLElement>(':scope > a')) {
    link.addEventListener('pointerenter', (event) => {
      if ((event as PointerEvent).pointerType !== 'mouse' || matchMedia(MOBILE).matches) return;
      cancelClose();
      closeAll();
    });
  }

  for (const dropdown of dropdowns) {
    const toggle = dropdown.querySelector<HTMLButtonElement>('[data-dropdown-toggle]');
    if (!toggle) continue;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      closeAll(dropdown);
      setDropdown(dropdown, !open);
    });

    // Pointer users get the menu on hover; touch and keyboard use the click above.
    dropdown.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse' || matchMedia(MOBILE).matches) return;
      cancelClose();
      closeAll(dropdown);
      setDropdown(dropdown, true);
    });

    dropdown.addEventListener('focusout', (event) => {
      if (!dropdown.contains(event.relatedTarget as Node)) setDropdown(dropdown, false);
    });
  }

  document.addEventListener('click', (event) => {
    if (!(event.target as HTMLElement).closest('[data-dropdown]')) closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
}

/*
 * A close fades the list out before taking it out of the layout, so it spans a
 * few hundred milliseconds during which the reader may well come back. Each
 * panel therefore parks a callback that abandons whatever it has in flight, and
 * the next state change runs it first — otherwise a close armed moments ago
 * strips the panel the pointer has since settled on.
 */
const settling = new WeakMap<HTMLElement, () => void>();

/** Where each panel was last asked to go, which the DOM alone cannot say. */
const intent = new WeakMap<HTMLElement, boolean>();

/** Two-step so the list is displayed before the opacity transition starts. */
function setDropdown(dropdown: HTMLElement, open: boolean): void {
  const toggle = dropdown.querySelector<HTMLElement>('[data-dropdown-toggle]');
  const list = dropdown.querySelector<HTMLElement>('[data-dropdown-list]');
  if (!toggle || !list) return;

  /*
   * Compared against the last request rather than against the DOM: a close
   * leaves `data-open` in place for the length of the fade, so the markup does
   * not say where the panel is headed, only where it currently stands.
   */
  if ((intent.get(list) ?? list.hasAttribute('data-open')) === open) return;
  intent.set(list, open);

  settling.get(list)?.();
  toggle.setAttribute('aria-expanded', String(open));

  if (open) {
    list.toggleAttribute('data-open', true);
    // Displayed for a frame first, so the fade has something to animate from.
    const show = () => {
      stop();
      list.toggleAttribute('data-visible', true);
    };
    const frame = requestAnimationFrame(show);
    // Frames stop arriving in a background tab; the panel still has to appear.
    const backstop = window.setTimeout(show, 60);
    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(backstop);
      settling.delete(list);
    };
    settling.set(list, stop);
    return;
  }

  list.removeAttribute('data-visible');

  const done = (event?: TransitionEvent) => {
    // Links inside the panel animate on hover, and those bubble to here.
    if (event && event.target !== list) return;
    abandon();
    list.removeAttribute('data-open');
  };
  // Fall back in case the transition never fires (reduced motion, hidden tab).
  const timer = window.setTimeout(done, 450);
  const abandon = () => {
    clearTimeout(timer);
    list.removeEventListener('transitionend', done);
    settling.delete(list);
  };

  list.addEventListener('transitionend', done);
  settling.set(list, abandon);
}

/* ----------------------------------------------------------- scroll hide -- */

function initScrollHide(header: HTMLElement): void {
  let last = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    /*
     * Any open menu pins the bar in place. Sliding it away would carry an open
     * mega menu out from under the pointer, which reads as a pointerleave and
     * dismisses the panel the reader was aiming at.
     */
    const menuOpen = header.querySelector('[data-nav-menu][data-open], [data-dropdown-list][data-open], [data-cart-panel][data-open]');

    // Only hide once the reader is past the header itself.
    if (!menuOpen && y > header.offsetHeight * 2) {
      header.toggleAttribute('data-hidden', y > last);
    } else {
      header.removeAttribute('data-hidden');
    }

    last = y;
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
}
