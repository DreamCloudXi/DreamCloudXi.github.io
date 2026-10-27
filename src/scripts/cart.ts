/**
 * The cart.
 *
 * The panel opens and closes, and the basket behind it lives in the browser's
 * local storage: Add to Cart puts a line in it, the panel lists the lines with
 * a quantity box and a remove link, and the count and subtotal follow. It is a
 * basket for this browser only — a static site has no server to keep one on, and
 * nothing here takes payment. A provider that does (Snipcart, a Shopify Buy
 * Button) can still be dropped in over the same `data-cart-*` hooks; see
 * `docs/commerce.md`.
 */

interface Line {
  id: string;
  name: string;
  price: number;
  currency: string;
  symbol: string;
  url: string;
  image: string;
  quantity: number;
}

const STORAGE_KEY = 'handspark-cart';

function read(): Line[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? (raw as Line[]) : [];
  } catch {
    return [];
  }
}

function write(lines: Line[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage can be blocked; the basket then lasts for this page only.
  }
}

let lines: Line[] = read();

const money = (line: Pick<Line, 'symbol' | 'currency'>, amount: number) =>
  `${line.symbol} ${amount.toFixed(2)} ${line.currency}`;

/** Draws the basket into every cart panel and the count beside every cart button. */
function render(): void {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  for (const badge of document.querySelectorAll<HTMLElement>('[data-cart-count]')) {
    badge.textContent = String(count);
  }

  for (const cart of document.querySelectorAll<HTMLElement>('[data-cart]')) {
    const list = cart.querySelector<HTMLElement>('[data-cart-items]');
    const filled = cart.querySelector<HTMLElement>('[data-cart-lines]');
    const empty = cart.querySelector<HTMLElement>('[data-cart-empty]');
    const total = cart.querySelector<HTMLElement>('[data-cart-total]');
    if (!list || !filled || !empty || !total) continue;

    filled.hidden = lines.length === 0;
    empty.hidden = lines.length > 0;
    list.replaceChildren(...lines.map(row));

    const first = lines[0];
    total.textContent = first
      ? money(first, lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
      : '\u2014';
  }
}

function row(line: Line): HTMLElement {
  const item = document.createElement('div');
  item.className = 'header-cart-item';
  item.dataset.cartLine = line.id;

  const link = document.createElement('a');
  link.href = line.url;
  const thumb = document.createElement('img');
  thumb.className = 'header-cart-thumb';
  thumb.src = line.image;
  thumb.alt = line.name;
  thumb.loading = 'lazy';
  link.append(thumb);

  const details = document.createElement('div');
  details.className = 'header-cart-details';
  const name = document.createElement('div');
  name.className = 'header-cart-name';
  name.textContent = line.name;
  const price = document.createElement('div');
  price.className = 'header-cart-price';
  price.textContent = money(line, line.price);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'header-cart-remove';
  remove.dataset.cartRemove = line.id;
  remove.textContent = 'Remove';
  details.append(name, price, remove);

  const quantity = document.createElement('input');
  quantity.className = 'header-cart-quantity w-input';
  quantity.type = 'number';
  quantity.min = '1';
  quantity.max = '99';
  quantity.value = String(line.quantity);
  quantity.dataset.cartQuantity = line.id;
  quantity.setAttribute('aria-label', `Quantity of ${line.name}`);

  item.append(link, details, quantity);
  return item;
}

function add(line: Line): void {
  const existing = lines.find((entry) => entry.id === line.id);
  if (existing) existing.quantity = Math.min(99, existing.quantity + line.quantity);
  else lines.push({ ...line, quantity: Math.min(99, line.quantity) });
  write(lines);
  render();
}

export function initCart(): void {
  const carts = document.querySelectorAll<HTMLElement>('[data-cart]');
  if (!carts.length) return;

  lines = read();
  render();

  /** A close removes the panel after its fade; an open in the meantime must cancel that. */
  const closing = new WeakMap<HTMLElement, number>();

  const setOpen = (cart: HTMLElement, open: boolean) => {
    const toggle = cart.querySelector<HTMLButtonElement>('[data-cart-toggle]');
    const panel = cart.querySelector<HTMLElement>('[data-cart-panel]');
    if (!toggle || !panel) return;

    toggle.setAttribute('aria-expanded', String(open));
    window.clearTimeout(closing.get(panel));
    if (open) {
      // The panel is drawn inside the bar; a bar that has slid away would take
      // it along, so bring the bar back first.
      document.querySelector('[data-header]')?.removeAttribute('data-hidden');
      panel.toggleAttribute('data-open', true);
      // Displayed for a frame first, so the fade has something to animate from.
      requestAnimationFrame(() => panel.toggleAttribute('data-visible', true));
      panel.querySelector<HTMLElement>('[data-cart-close]')?.focus();
    } else {
      panel.removeAttribute('data-visible');
      closing.set(
        panel,
        window.setTimeout(() => panel.removeAttribute('data-open'), 250)
      );
    }
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const closeAll = () => carts.forEach((cart) => setOpen(cart, false));

  for (const cart of carts) {
    const toggle = cart.querySelector<HTMLButtonElement>('[data-cart-toggle]');
    const panel = cart.querySelector<HTMLElement>('[data-cart-panel]');
    if (!toggle || !panel) continue;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!open) setOpen(cart, true);
    });

    cart.querySelector('[data-cart-close]')?.addEventListener('click', () => setOpen(cart, false));

    // The panel is a full-screen scrim; a click on the scrim itself dismisses it.
    panel.addEventListener('click', (event) => {
      if (event.target === panel) setOpen(cart, false);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });

  // Add to Cart, on a card or a product page. Listening on the document keeps
  // it working for cards that arrive later, as when the shop changes page.
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-add-to-cart')) return;
    event.preventDefault();

    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? '');
    const price = Number(text('price'));
    if (!text('id') || !Number.isFinite(price)) return;

    add({
      id: text('id'),
      name: text('name'),
      price,
      currency: text('currency'),
      symbol: text('symbol') || '$',
      url: text('url'),
      image: text('image'),
      quantity: Math.max(1, Math.round(Number(text('quantity')) || 1)),
    });

    // Show the basket, in whichever of the two panels this width displays.
    const visible = [...carts].find((cart) => cart.getClientRects().length > 0);
    const toggle = visible?.querySelector<HTMLButtonElement>('[data-cart-toggle]');
    if (visible && toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  });

  // Quantity boxes and Remove links inside the panels.
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.cartQuantity) return;
    const line = lines.find((entry) => entry.id === input.dataset.cartQuantity);
    if (!line) return;
    const quantity = Math.round(Number(input.value));
    if (!(quantity >= 1)) {
      input.value = String(line.quantity);
      return;
    }
    line.quantity = Math.min(99, quantity);
    write(lines);
    render();
  });

  document.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-cart-remove]');
    if (!button) return;
    lines = lines.filter((entry) => entry.id !== button.dataset.cartRemove);
    write(lines);
    render();
  });

  // Another tab changed the basket.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    lines = read();
    render();
  });
}
