/**
 * Antigravity Modern & Seed Jewelry Theme JS
 * Lightweight, vanilla ES6 - zero external dependencies
 */

class CartDrawer {
  constructor() {
    this.drawer = document.querySelector('#CartDrawer');
    this.openButtons = document.querySelectorAll('[data-cart-drawer-toggle]');
    this.closeButtons = document.querySelectorAll('[data-cart-drawer-close]');
    this.overlay = document.querySelector('.cart-drawer__overlay');
    this.itemsContainer = document.querySelector('#CartDrawerItems');
    this.subtotalElement = document.querySelector('#CartDrawerSubtotal');
    this.countBadges = document.querySelectorAll('.header__cart-count');

    this.init();
  }

  init() {
    if (!this.drawer) return;

    this.openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    if (this.itemsContainer) {
      this.itemsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('[data-cart-action]');
        if (!target) return;

        const action = target.getAttribute('data-cart-action');
        const key = target.getAttribute('data-line-key');
        const currentQty = parseInt(target.getAttribute('data-qty') || '0', 10);

        if (action === 'increment') {
          this.updateQuantity(key, currentQty + 1);
        } else if (action === 'decrement') {
          this.updateQuantity(key, Math.max(0, currentQty - 1));
        } else if (action === 'remove') {
          this.updateQuantity(key, 0);
        }
      });
    }
  }

  isOpen() {
    return this.drawer && this.drawer.classList.contains('active');
  }

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  async fetchCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      this.renderCart(cart);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }

  async updateQuantity(lineKey, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lineKey, quantity: quantity })
      });
      const cart = await res.json();
      this.renderCart(cart);
    } catch (err) {
      console.error('Failed to change item quantity:', err);
    }
  }

  renderCart(cart) {
    this.countBadges.forEach(badge => {
      badge.textContent = cart.item_count;
      badge.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });

    if (this.subtotalElement) {
      this.subtotalElement.textContent = this.formatMoney(cart.total_price);
    }

    if (!this.itemsContainer) return;

    if (cart.items.length === 0) {
      this.itemsContainer.innerHTML = `
        <div class="cart-drawer__empty">
          <p>Your cart is empty.</p>
          <a href="/collections/all" class="btn btn-primary" style="margin-top:1rem;">Continue Shopping</a>
        </div>
      `;
      const footer = document.querySelector('.cart-drawer__footer');
      if (footer) footer.style.display = 'none';
      return;
    }

    const footer = document.querySelector('.cart-drawer__footer');
    if (footer) footer.style.display = 'block';

    let html = '<ul class="cart-drawer__items">';
    cart.items.forEach(item => {
      const imageSrc = item.image ? item.image : '';
      const variantTitle = item.variant_title ? `<div style="font-size:0.8rem;color:#64748b;">${item.variant_title}</div>` : '';

      html += `
        <li class="cart-drawer__item">
          ${imageSrc ? `<img src="${imageSrc}" class="cart-drawer__item-img" alt="${item.title}">` : '<div class="cart-drawer__item-img"></div>'}
          <div>
            <div style="font-size:0.92rem;font-weight:600;">${item.product_title}</div>
            ${variantTitle}
            <div style="font-weight:600;margin:0.25rem 0;">${this.formatMoney(item.final_line_price)}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.4rem;">
              <div class="quantity-control">
                <button type="button" class="quantity-btn" data-cart-action="decrement" data-line-key="${item.key}" data-qty="${item.quantity}">-</button>
                <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                <button type="button" class="quantity-btn" data-cart-action="increment" data-line-key="${item.key}" data-qty="${item.quantity}">+</button>
              </div>
              <button type="button" class="cart-drawer__item-remove" data-cart-action="remove" data-line-key="${item.key}">Remove</button>
            </div>
          </div>
        </li>
      `;
    });
    html += '</ul>';

    this.itemsContainer.innerHTML = html;
  }
}

// Global AJAX Add to cart handler
function initAjaxAddToCart(cartDrawer) {
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[action*="/cart/add"]');
    if (!form) return;

    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerText || submitBtn.value : '';

    if (submitBtn) {
      if (submitBtn.tagName === 'INPUT') submitBtn.value = 'Adding...';
      else submitBtn.innerText = 'Adding...';
      submitBtn.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Add to cart failed');

      if (cartDrawer) {
        await cartDrawer.fetchCart();
        cartDrawer.open();
      } else {
        window.location.href = '/cart';
      }
    } catch (err) {
      console.error(err);
      alert('Could not add item to cart. Please check stock availability.');
    } finally {
      if (submitBtn) {
        if (submitBtn.tagName === 'INPUT') submitBtn.value = originalText;
        else submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    }
  });
}

// Left Off-Canvas Mega Nav Drawer Handler
function initOffCanvasNav() {
  const toggleBtns = document.querySelectorAll('[data-nav-drawer-toggle]');
  const drawer = document.querySelector('#NavDrawer');
  const closeBtns = document.querySelectorAll('[data-nav-drawer-close]');

  if (!drawer) return;

  function open(e) {
    if (e) e.preventDefault();
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close(e) {
    if (e) e.preventDefault();
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtns.forEach(btn => btn.addEventListener('click', open));
  closeBtns.forEach(btn => btn.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      close();
    }
  });
}

// Transparent & Sticky Header Scroll Transition
function initHeaderScroll() {
  const headerWrapper = document.querySelector('.header-wrapper');
  if (!headerWrapper) return;

  function onScroll() {
    if (window.scrollY > 30) {
      headerWrapper.classList.add('scrolled');
    } else {
      headerWrapper.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  const cartDrawer = new CartDrawer();
  window.cartDrawerInstance = cartDrawer;
  initAjaxAddToCart(cartDrawer);
  initOffCanvasNav();
  initHeaderScroll();
});


// Apply Discount & Gift Card Code from Cart Drawer
window.applyDrawerDiscount = function() {
  const input = document.getElementById('CartDrawerDiscountCode');
  const hiddenInput = document.getElementById('CartDrawerHiddenDiscount');
  const msg = document.getElementById('DrawerDiscountAppliedMsg');
  const form = document.getElementById('CartDrawerCheckoutForm');
  if (!input) return;

  const code = input.value.trim();
  if (code) {
    if (hiddenInput) hiddenInput.value = code;
    if (form) form.action = '/checkout?discount=' + encodeURIComponent(code);
    if (msg) {
      msg.textContent = `✓ Code "${code.toUpperCase()}" applied to checkout!`;
      msg.style.display = 'block';
    }
  } else {
    if (msg) msg.style.display = 'none';
  }
};
