/**
 * Seed Jewelry Header & Storefront Interactivity
 * Handles sticky navbar transitions, off-canvas left drawer, search modal,
 * and client-side wishlist management with real-time header count sync.
 */

class WishlistManager {
  constructor() {
    this.storageKey = 'streetride_wishlist_items';
    this.items = this.load();
    this.badge = document.querySelector('.site-header__wishlist-count');
    this.init();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Ensure backwards compatibility with array of IDs or array of Objects
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {}
  }

  init() {
    this.updateBadge();
    this.renderDrawer();

    // Delegate clicks on all wishlist heart buttons across products & cards
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-wishlist-btn]');
      if (!btn) return;
      e.preventDefault();

      const productId = btn.getAttribute('data-product-id');
      if (!productId) return;

      const productData = {
        id: productId,
        title: btn.getAttribute('data-product-title') || 'Skateboard Product',
        price: btn.getAttribute('data-product-price') || '',
        url: btn.getAttribute('data-product-url') || '/collections/all',
        image: btn.getAttribute('data-product-image') || '',
        variantId: btn.getAttribute('data-variant-id') || ''
      };

      this.toggle(productData, btn);
    });

    this.syncActiveButtons();
  }

  toggle(productData, btn) {
    const id = String(productData.id);
    const index = this.items.findIndex(item => String(typeof item === 'object' ? item.id : item) === id);

    if (index > -1) {
      this.items.splice(index, 1);
      if (btn) btn.classList.remove('active');
    } else {
      this.items.push(productData);
      if (btn) btn.classList.add('active');
    }

    this.save();
    this.updateBadge();
    this.syncActiveButtons();
    this.renderDrawer();
  }

  remove(id) {
    const strId = String(id);
    this.items = this.items.filter(item => String(typeof item === 'object' ? item.id : item) !== strId);
    this.save();
    this.updateBadge();
    this.syncActiveButtons();
    this.renderDrawer();
  }

  updateBadge() {
    const badges = document.querySelectorAll('.site-header__wishlist-count');
    badges.forEach(b => {
      b.textContent = this.items.length;
    });
  }

  syncActiveButtons() {
    const currentIds = this.items.map(item => String(typeof item === 'object' ? item.id : item));
    document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
      const id = String(btn.getAttribute('data-product-id'));
      if (currentIds.includes(id)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  renderDrawer() {
    const container = document.getElementById('WishlistDrawerItems');
    const emptyState = document.getElementById('WishlistDrawerEmpty');
    if (!container || !emptyState) return;

    if (this.items.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    let html = '';

    this.items.forEach(item => {
      const product = typeof item === 'object' ? item : { id: item, title: 'Product ' + item, price: '', url: '/collections/all', image: '' };
      html += `
        <div class="wishlist-drawer-item" style="display: flex; gap: 1rem; align-items: center; padding: 0.85rem; background: #ffffff; border: 1px solid #E8E6E1; border-radius: 2px;">
          <a href="${product.url}" style="width: 70px; height: 70px; flex-shrink: 0; background: #f4f3ef; border-radius: 2px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${product.image ? `<img src="${product.image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 0.7rem; color: #888;">StreetRide</span>`}
          </a>
          <div style="flex: 1; min-width: 0;">
            <a href="${product.url}" style="display: block; font-size: 0.88rem; font-weight: 500; color: #141414; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.25rem;">
              ${product.title}
            </a>
            ${product.price ? `<div style="font-size: 0.82rem; color: #B89C72; font-weight: 600;">${product.price}</div>` : ''}
            <div style="display: flex; gap: 0.75rem; margin-top: 0.4rem; align-items: center;">
              <a href="${product.url}" class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.7rem; text-transform: uppercase;">View</a>
              <button type="button" onclick="window.seedWishlist.remove('${product.id}')" style="background: none; border: none; font-size: 0.72rem; color: #999999; cursor: pointer; text-decoration: underline;" aria-label="Remove item">
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Wishlist System
  window.seedWishlist = new WishlistManager();

  // 2. Sticky & Scroll Transitions
  const headerWrapper = document.querySelector('.site-header-wrapper');
  if (headerWrapper) {
    function onScroll() {
      if (window.scrollY > 20) {
        headerWrapper.classList.add('scrolled');
      } else {
        headerWrapper.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 3. Off-Canvas Left Navigation Drawer
  const navDrawer = document.querySelector('#NavDrawer');
  const navTriggers = document.querySelectorAll('[data-nav-drawer-toggle]');
  const navCloseBtns = document.querySelectorAll('[data-nav-drawer-close]');

  if (navDrawer) {
    function openNav(e) {
      if (e) e.preventDefault();
      navDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeNav(e) {
      if (e) e.preventDefault();
      navDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }

    navTriggers.forEach(btn => btn.addEventListener('click', openNav));
    navCloseBtns.forEach(btn => btn.addEventListener('click', closeNav));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDrawer.classList.contains('active')) {
        closeNav();
      }
    });
  }

  // 4. Search Drawer Logic
  const searchDrawer = document.querySelector('#SearchDrawer');
  const searchTriggers = document.querySelectorAll('[data-search-trigger]');
  const searchCloseBtns = document.querySelectorAll('[data-search-close]');
  const searchInput = document.querySelector('#SearchDrawerInput');

  if (searchDrawer) {
    function openSearch(e) {
      if (e) e.preventDefault();
      searchDrawer.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 150);
    }

    function closeSearch(e) {
      if (e) e.preventDefault();
      searchDrawer.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    searchTriggers.forEach(btn => btn.addEventListener('click', openSearch));
    searchCloseBtns.forEach(btn => btn.addEventListener('click', closeSearch));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchDrawer.classList.contains('is-active')) {
        closeSearch();
      }
    });
  }

  // 5. Wishlist Slide-out Drawer Logic
  const wishlistDrawer = document.querySelector('#WishlistDrawer');
  const wishlistTriggers = document.querySelectorAll('[data-wishlist-drawer-toggle]');
  const wishlistCloseBtns = document.querySelectorAll('[data-wishlist-drawer-close]');

  if (wishlistDrawer) {
    const panel = wishlistDrawer.querySelector('.nav-drawer__panel');
    function openWishlist(e) {
      if (e) e.preventDefault();
      wishlistDrawer.style.display = 'block';
      setTimeout(() => {
        wishlistDrawer.classList.add('active');
        if (panel) panel.style.transform = 'translateX(0)';
      }, 10);
      document.body.style.overflow = 'hidden';
    }

    function closeWishlist(e) {
      if (e) e.preventDefault();
      if (panel) panel.style.transform = 'translateX(100%)';
      wishlistDrawer.classList.remove('active');
      setTimeout(() => {
        wishlistDrawer.style.display = 'none';
      }, 350);
      document.body.style.overflow = '';
    }

    wishlistTriggers.forEach(btn => btn.addEventListener('click', openWishlist));
    wishlistCloseBtns.forEach(btn => btn.addEventListener('click', closeWishlist));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wishlistDrawer.classList.contains('active')) {
        closeWishlist();
      }
    });
  }
});


  // 6. Localization Selector Modal Logic
  const locModal = document.querySelector('#LocalizationModal');
  const locTriggers = document.querySelectorAll('[data-localization-trigger]');
  const locCloseBtns = document.querySelectorAll('[data-localization-close]');

  if (locModal) {
    function openLocModal(e) {
      if (e) e.preventDefault();
      locModal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    function closeLocModal(e) {
      if (e) e.preventDefault();
      locModal.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    locTriggers.forEach(btn => btn.addEventListener('click', openLocModal));
    locCloseBtns.forEach(btn => btn.addEventListener('click', closeLocModal));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && locModal.classList.contains('is-active')) {
        closeLocModal();
      }
    });
  }
