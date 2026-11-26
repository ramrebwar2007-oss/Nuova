'use strict';

const defaultProducts = [
  { id: 'essential-tee', name: 'Essential T-Shirt', category: 'clothing', type: 'Premium cotton jersey', price: 42, image: 'assets/product-tee.svg', badge: 'NEW ARRIVAL', colors: ['#F8F6F1', '#B69B80', '#3A2118'], description: 'A clean everyday essential with a considered fit and a subtle NUOVA signature.' },
  { id: 'signature-hoodie', name: 'Signature Hoodie', category: 'clothing', type: 'Soft heavyweight fleece', price: 89, image: 'assets/product-hoodie.svg', badge: 'BESTSELLER', colors: ['#76543C', '#D8CCBD'], description: 'A relaxed layer in a rich cocoa tone, designed for effortless everyday wear.' },
  { id: 'tailored-shirt', name: 'Everyday Shirt', category: 'clothing', type: 'Textured cotton blend', price: 74, image: 'assets/product-shirt.svg', badge: 'NEW ARRIVAL', colors: ['#D7C6B3', '#FFFFFF'], description: 'An understated shirt with a soft structure and an easy, refined silhouette.' },
  { id: 'court-sneaker', name: 'Court Sneaker', category: 'shoes', type: 'Minimal leather-look sneaker', price: 115, image: 'assets/product-sneaker.svg', badge: 'NEW ARRIVAL', colors: ['#F6F1E8', '#6C4A32'], description: 'A versatile low-profile sneaker in a neutral palette made to pair with everything.' },
  { id: 'classic-watch', name: 'Classic Watch', category: 'accessories', type: 'Cocoa strap · minimal dial', price: 139, image: 'assets/product-watch.svg', badge: 'SIGNATURE', colors: ['#6D492E', '#1E1B18'], description: 'A timeless finishing touch with a warm leather-look strap and a pared-back dial.' },
  { id: 'cocoa-jacket', name: 'Cocoa Jacket', category: 'clothing', type: 'Structured outerwear', price: 168, image: 'assets/product-jacket.svg', badge: 'LIMITED EDIT', colors: ['#684A34', '#25201C'], description: 'A confident outer layer with clean lines, tailored details, and a deep cocoa finish.' },
  { id: 'relaxed-trouser', name: 'Relaxed Trouser', category: 'clothing', type: 'Modern straight fit', price: 92, image: 'assets/product-trousers.svg', badge: 'ESSENTIAL', colors: ['#8A735F', '#3B3028'], description: 'A versatile trouser with a relaxed profile and an understated neutral shade.' },
  { id: 'weekend-sneaker', name: 'Weekend Sneaker', category: 'shoes', type: 'Everyday comfort', price: 108, image: 'assets/cat-shoes.svg', badge: 'BESTSELLER', colors: ['#F3EDE3', '#9A795B'], description: 'A pared-back everyday shoe designed to bring comfort and simplicity together.' }
];

function loadProducts() {
  try {
    const raw = localStorage.getItem('nuova-products');
    if (!raw) {
      localStorage.setItem('nuova-products', JSON.stringify(defaultProducts));
      return [...defaultProducts];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultProducts];
  } catch (error) {
    return [...defaultProducts];
  }
}

let products = loadProducts();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
let cart = loadCart();
let toastTimer;
let drawerCloseTimer;
let quickViewCloseTimer;
let quickViewOpenTimer;

function syncBodyLock() {
  const anyOpen = !$('#cartDrawer').hidden || !$('#quickView').hidden || !$('#searchModal').hidden;
  document.body.classList.toggle('locked', anyOpen);
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('nuova-cart') || '[]');
    return Array.isArray(saved) ? saved.filter(item => products.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch (error) {
    return [];
  }
}
function saveCart() {
  try { localStorage.setItem('nuova-cart', JSON.stringify(cart)); } catch (error) { showToast('Your browser could not save the bag on this device.'); }
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function getCartCount() { return cart.reduce((total, item) => total + item.quantity, 0); }
function getCartSubtotal() {
  return cart.reduce((total, item) => {
    const product = products.find(productItem => productItem.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}
function productCard(product) {
  return `
    <article class="product-card reveal is-visible" data-product-id="${product.id}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-badge">${product.badge}</span>
        <button class="quick-view-trigger" type="button" data-quick-view="${product.id}">QUICK VIEW +</button>
      </div>
      <div class="product-info">
        <div><h3>${product.name}</h3><p>${product.type}</p><div class="product-colors" aria-label="Available color options">${product.colors.map(color => `<span class="color-dot" style="background:${color}"></span>`).join('')}</div></div>
        <span class="product-price">${money(product.price)}</span>
      </div>
    </article>`;
}
function renderProducts(filter = 'all', searchTerm = '') {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const shown = products.filter(product => (filter === 'all' || product.category === filter) && (!normalizedTerm || `${product.name} ${product.type} ${product.category}`.toLowerCase().includes(normalizedTerm)));
  $('#productGrid').innerHTML = shown.length ? shown.map(productCard).join('') : '<p class="empty-products">No pieces found. Try another search or category.</p>';
  $('#productCount').textContent = `${String(shown.length).padStart(2, '0')} ${shown.length === 1 ? 'PRODUCT' : 'PRODUCTS'}`;
}
function updateCartUI() {
  const count = getCartCount();
  $('#bagCount').textContent = count > 99 ? '99+' : String(count);
  $('#drawerCount').textContent = `(${count})`;
  $('#cartSubtotal').textContent = money(getCartSubtotal());
  if (!cart.length) {
    $('#cartItems').innerHTML = '<div class="cart-empty">Your bag is waiting for something considered.<br><br><a class="text-link" href="#new-arrivals">DISCOVER THE COLLECTION →</a></div>';
  } else {
    $('#cartItems').innerHTML = cart.map(item => {
      const product = products.find(entry => entry.id === item.id);
      if (!product) return '';
      return `<div class="cart-row" data-cart-id="${product.id}" data-cart-size="${item.size || ''}">
        <img src="${product.image}" alt="${product.name}">
        <div><h3>${product.name}</h3><p>${item.size ? `Size: ${item.size} · ` : ''}${money(product.price)}</p>
          <div class="cart-quantity"><button type="button" data-quantity="minus" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="plus" aria-label="Increase quantity">+</button></div>
        </div>
        <div class="cart-row-price"><strong>${money(product.price * item.quantity)}</strong><button class="remove-item" type="button" data-remove-item>Remove</button></div>
      </div>`;
    }).join('');
  }
  saveCart();
}
function addToCart(productId, size = '') {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId && item.size === size);
  if (existing) existing.quantity += 1;
  else cart.push({ id: productId, size, quantity: 1 });
  updateCartUI();
  showToast(`${product.name} added to your bag.`);
}
function openDrawer() {
  clearTimeout(drawerCloseTimer);
  clearTimeout(quickViewOpenTimer);
  if (!$('#quickView').hidden) closeQuickView(true);
  if (!$('#searchModal').hidden) closeSearch();
  closeMobileMenu();
  $('#overlay').hidden = false;
  $('#cartDrawer').hidden = false;
  void $('#cartDrawer').offsetWidth;
  requestAnimationFrame(() => {
    $('#overlay').classList.add('visible');
    $('#cartDrawer').classList.add('open');
  });
  syncBodyLock();
  updateCartUI();
}
function closeDrawer(immediate = false) {
  clearTimeout(drawerCloseTimer);
  toggleCheckoutForm(false);
  $('#cartDrawer').classList.remove('open');
  if ($('#quickView').hidden) $('#overlay').classList.remove('visible');
  if (immediate) {
    $('#cartDrawer').hidden = true;
    if ($('#quickView').hidden) $('#overlay').hidden = true;
    syncBodyLock();
    return;
  }
  drawerCloseTimer = setTimeout(() => {
    $('#cartDrawer').hidden = true;
    if ($('#quickView').hidden) $('#overlay').hidden = true;
    syncBodyLock();
  }, 350);
  document.body.classList.remove('locked');
}
function openQuickView(productId) {
  clearTimeout(quickViewCloseTimer);
  clearTimeout(quickViewOpenTimer);
  if (!$('#searchModal').hidden) closeSearch();
  if (!$('#cartDrawer').hidden) closeDrawer(true);
  const product = products.find(item => item.id === productId);
  if (!product) return;
  closeMobileMenu();
  const sizeOptions = product.category === 'accessories' ? '<option value="One size">One size</option>' : '<option value="">Choose a size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>';
  $('#quickViewContent').innerHTML = `<div class="quick-content">
    <img src="${product.image}" alt="${product.name}">
    <div><p class="eyebrow">${product.badge}</p><h2>${product.name}</h2><div class="quick-price">${money(product.price)}</div><p>${product.description}</p>
    <label for="quickSize">${product.category === 'accessories' ? 'SIZE' : 'SELECT YOUR SIZE'}</label><select id="quickSize">${sizeOptions}</select>
    <button class="button button-dark" id="quickAdd" type="button">ADD TO BAG <span>↗</span></button>
    <p class="demo-note">Product preview · Sample catalog item</p></div></div>`;
  $('#quickView').hidden = false;
  $('#overlay').hidden = false;
  void $('#quickView').offsetWidth;
  requestAnimationFrame(() => { $('#overlay').classList.add('visible'); $('#quickView').classList.add('open'); });
  syncBodyLock();
  $('#quickAdd').addEventListener('click', () => {
    const size = $('#quickSize').value;
    if (!size) { showToast('Please choose a size first.'); $('#quickSize').focus(); return; }
    addToCart(productId, size);
    closeQuickView();
    quickViewOpenTimer = setTimeout(openDrawer, 280);
  });
}
function closeQuickView(immediate = false) {
  clearTimeout(quickViewCloseTimer);
  $('#quickView').classList.remove('open');
  if ($('#cartDrawer').hidden) $('#overlay').classList.remove('visible');
  if (immediate) {
    $('#quickView').hidden = true;
    if ($('#cartDrawer').hidden) $('#overlay').hidden = true;
    syncBodyLock();
    return;
  }
  quickViewCloseTimer = setTimeout(() => {
    $('#quickView').hidden = true;
    if ($('#cartDrawer').hidden) $('#overlay').hidden = true;
    syncBodyLock();
  }, 260);
  document.body.classList.remove('locked');
}
function openSearch() {
  clearTimeout(quickViewOpenTimer);
  if (!$('#cartDrawer').hidden) closeDrawer(true);
  if (!$('#quickView').hidden) closeQuickView(true);
  closeMobileMenu();
  $('#searchModal').hidden = false;
  syncBodyLock();
  setTimeout(() => $('#searchInput').focus(), 40);
  renderSearchResults('');
}
function closeSearch() {
  $('#searchModal').hidden = true;
  syncBodyLock();
}
function renderSearchResults(term) {
  const normalized = term.trim().toLowerCase();
  const results = products.filter(product => !normalized || `${product.name} ${product.category} ${product.type}`.toLowerCase().includes(normalized)).slice(0, 6);
  $('#searchResults').innerHTML = results.length ? results.map(product => `<button class="search-result" type="button" data-quick-view="${product.id}"><img src="${product.image}" alt=""><span><strong>${product.name}</strong><small>${product.category.toUpperCase()} · ${money(product.price)}</small></span></button>`).join('') : '<p>No products found. Try a different word.</p>';
}
function closeMobileMenu() {
  const nav = $('#mobileNav');
  nav.hidden = true;
  $('#menuToggle').setAttribute('aria-expanded', 'false');
  $('#menuToggle').setAttribute('aria-label', 'Open navigation');
}

// Product filters and quick views use event delegation so they also work after re-rendering.
document.addEventListener('click', event => {
  const quickButton = event.target.closest('[data-quick-view]');
  if (quickButton) {
    event.preventDefault();
    openQuickView(quickButton.dataset.quickView);
    return;
  }
  const categoryLink = event.target.closest('[data-category-link]');
  if (categoryLink) {
    const category = categoryLink.dataset.categoryLink;
    $$('.filter-button').forEach(button => button.classList.toggle('active', button.dataset.filter === category));
    renderProducts(category);
  }
});

$$('.filter-button').forEach(button => button.addEventListener('click', () => {
  $$('.filter-button').forEach(item => item.classList.toggle('active', item === button));
  renderProducts(button.dataset.filter);
}));

$('.bag-open').addEventListener('click', openDrawer);
$$('.drawer-close').forEach(button => button.addEventListener('click', closeDrawer));
$('#overlay').addEventListener('click', () => {
  if (!$('#cartDrawer').hidden) closeDrawer();
  if (!$('#quickView').hidden) closeQuickView();
});
$$('.search-open').forEach(button => button.addEventListener('click', openSearch));
$('.search-close').addEventListener('click', closeSearch);
$('#searchInput').addEventListener('input', event => renderSearchResults(event.target.value));
$('#searchInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const term = event.target.value.trim();
    closeSearch();
    renderProducts('all', term);
    $('#new-arrivals').scrollIntoView({ behavior: 'smooth' });
  }
});
$('.quick-close').addEventListener('click', closeQuickView);
$('#menuToggle').addEventListener('click', () => {
  const nav = $('#mobileNav');
  const opening = nav.hidden;
  nav.hidden = !opening;
  $('#menuToggle').setAttribute('aria-expanded', String(opening));
  $('#menuToggle').setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
});
$$('#mobileNav a').forEach(link => link.addEventListener('click', closeMobileMenu));
$('#cartItems').addEventListener('click', event => {
  if (event.target.closest('a[href^="#"]')) {
    closeDrawer();
    return;
  }
  const row = event.target.closest('[data-cart-id]');
  if (!row) return;
  const item = cart.find(entry => entry.id === row.dataset.cartId && (entry.size || '') === row.dataset.cartSize);
  if (!item) return;
  if (event.target.closest('[data-remove-item]')) cart = cart.filter(entry => entry !== item);
  if (event.target.closest('[data-quantity="minus"]')) item.quantity = Math.max(1, item.quantity - 1);
  if (event.target.closest('[data-quantity="plus"]')) item.quantity += 1;
  updateCartUI();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 760 && !$('#mobileNav').hidden) closeMobileMenu();
});
function toggleCheckoutForm(show) {
  const form = $('#checkoutForm');
  const button = $('#checkoutButton');
  if (!form || !button) return;
  form.hidden = !show;
  button.hidden = show;
}
$('#checkoutButton').addEventListener('click', () => {
  if (!cart.length) {
    showToast('Your bag is empty. Add a product first.');
    return;
  }
  toggleCheckoutForm(true);
  $('#checkoutName').focus();
});
$('#checkoutCancel').addEventListener('click', () => toggleCheckoutForm(false));
$('#checkoutForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!cart.length) return;
  const name = $('#checkoutName').value.trim();
  const contact = $('#checkoutContact').value.trim();
  const address = $('#checkoutAddress').value.trim();
  if (!name || !contact || !address) {
    showToast('Please fill in your name, contact, and address.');
    return;
  }
  const orderItems = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return product ? {
      id: product.id,
      name: product.name,
      size: item.size || 'One size',
      quantity: item.quantity,
      price: product.price
    } : null;
  }).filter(Boolean);

  const order = {
    id: `NV-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    customer: { name, contact, address },
    items: orderItems,
    subtotal: getCartSubtotal(),
    status: 'New'
  };

  try {
    const existing = JSON.parse(localStorage.getItem('nuova-orders') || '[]');
    const orders = Array.isArray(existing) ? existing : [];
    orders.unshift(order);
    localStorage.setItem('nuova-orders', JSON.stringify(orders));
  } catch (error) {
    showToast('Could not save order on this browser.');
    return;
  }

  cart = [];
  updateCartUI();
  $('#checkoutForm').reset();
  toggleCheckoutForm(false);
  closeDrawer();
  showToast(`Order ${order.id} placed! Thank you, ${name}.`);
});
window.addEventListener('storage', event => {
  if (event.key === 'nuova-products') {
    products = loadProducts();
    const activeFilter = $('.filter-button.active')?.dataset.filter || 'all';
    renderProducts(activeFilter);
    updateCartUI();
  }
});
$('#newsletterForm').addEventListener('submit', event => {
  event.preventDefault();
  const email = $('#newsletterEmail').value.trim();
  if (!email || !$('#newsletterEmail').checkValidity()) { $('#newsletterEmail').reportValidity(); return; }
  $('#newsletterMessage').textContent = 'Thank you — this demo form is ready for a future email service. No email was sent.';
  $('#newsletterEmail').value = '';
  showToast('Thank you for your interest in NUOVA.');
});

// Escape key closes active overlays. Keep keyboard behavior predictable.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!$('#searchModal').hidden) closeSearch();
    if (!$('#quickView').hidden) closeQuickView();
    if (!$('#cartDrawer').hidden) closeDrawer();
    closeMobileMenu();
  }
});

// Sticky header styling.
const header = $('.site-header');
const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Gentle scroll reveal; users with reduced-motion preference see all content immediately.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-ready');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  $$('.reveal').forEach(element => observer.observe(element));
}

$('#year').textContent = new Date().getFullYear();
renderProducts();
updateCartUI();
