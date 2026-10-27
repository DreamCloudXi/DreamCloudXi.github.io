/**
 * The gallery lightbox.
 *
 * Every cell is already a link to the full-size file, so the page works with no
 * JavaScript at all — following one opens the photograph. This intercepts that
 * and shows it over the page instead, with the arrow keys moving through the
 * set and Escape returning the reader to the thumbnail they came from.
 */
export function initLightbox(): void {
  const groups = document.querySelectorAll<HTMLElement>('[data-lightbox-group]');
  if (!groups.length) return;

  for (const group of groups) {
    const links = [...group.querySelectorAll<HTMLAnchorElement>('[data-lightbox]')];
    if (!links.length) continue;

    let index = 0;
    let overlay: HTMLElement | null = null;
    let opener: HTMLAnchorElement | null = null;

    const show = (next: number) => {
      index = (next + links.length) % links.length;
      const link = links[index];
      const image = overlay?.querySelector('img');
      if (!image) return;
      image.src = link.href;
      image.alt = link.querySelector('img')?.alt ?? '';
    };

    const close = () => {
      overlay?.remove();
      overlay = null;
      document.body.style.overflow = '';
      opener?.focus();
    };

    const open = (from: number, link: HTMLAnchorElement) => {
      opener = link;
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Photograph');
      overlay.innerHTML = `
        <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
        <button type="button" class="lightbox-prev" aria-label="Previous">&lsaquo;</button>
        <img alt="" />
        <button type="button" class="lightbox-next" aria-label="Next">&rsaquo;</button>`;

      overlay.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target === overlay || target.closest('.lightbox-close')) close();
        else if (target.closest('.lightbox-prev')) show(index - 1);
        else if (target.closest('.lightbox-next')) show(index + 1);
      });

      document.body.append(overlay);
      document.body.style.overflow = 'hidden';
      show(from);
      overlay.querySelector<HTMLButtonElement>('.lightbox-close')?.focus();
    };

    links.forEach((link, i) => {
      link.addEventListener('click', (event) => {
        // Let a modified click do what the reader asked: a new tab, a download.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        open(i, link);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (!overlay) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
  }
}
