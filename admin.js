'use strict';

const ADMIN_USER = 'admin';
const ADMIN_PASS = '12345';
const AUTH_KEY = 'nuova-admin-auth';
const PRODUCTS_KEY = 'nuova-products';
const ORDERS_KEY = 'nuova-orders';

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

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
let toastTimer;

function showToast(message) {
  const toast = $('#adminToast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
      return [...defaultProducts];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultProducts];
  } catch (error) {
    return [...defaultProducts];
  }
}

function saveProducts(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

function loadOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveOrders(list) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}

function setAuthState(loggedIn) {
  $('#loginSection').hidden = loggedIn;
  $('#adminApp').hidden = !loggedIn;
  $('#logoutButton').hidden = !loggedIn;
  if (loggedIn) renderAll();
}

function renderStats(products, orders) {
  const newCount = orders.filter(order => order.status === 'New').length;
  const revenue = orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);
  $('#statProducts').textContent = products.length;
  $('#statOrders').textContent = orders.length;
  $('#statNewOrders').textContent = newCount;
  $('#statRevenue').textContent = money(revenue);
  $('#newOrdersBadge').textContent = newCount;
}

function renderProductList(products) {
  const container = $('#adminProductList');
  if (!products.length) {
    container.innerHTML = '<div class="empty-state">No products yet. Add your first product on the left.</div>';
    return;
  }
  container.innerHTML = products.map(product => `
    <div class="product-item" data-id="${escapeHtml(product.id)}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.category.toUpperCase())} · ${money(product.price)} · ${escapeHtml(product.badge || 'ESSENTIAL')}</p>
        <p>${escapeHtml(product.type)}</p>
      </div>
      <div class="item-actions">
        <button class="mini-btn" type="button" data-edit="${escapeHtml(product.id)}">Edit</button>
        <button class="mini-btn danger" type="button" data-delete="${escapeHtml(product.id)}">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderOrdersList(orders) {
  const container = $('#ordersList');
  if (!orders.length) {
    container.innerHTML = '<div class="empty-state">No purchase orders yet. When a customer checks out on the storefront, it will appear here.</div>';
    return;
  }
  container.innerHTML = orders.map(order => {
    const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now';
    const itemsHtml = (order.items || []).map(item =>
      `<li>${escapeHtml(item.name)} (Size: ${escapeHtml(item.size)}) × ${Number(item.quantity)} — ${money(item.price * item.quantity)}</li>`
    ).join('');
    return `
      <article class="order-card" data-order-id="${escapeHtml(order.id)}">
        <div class="order-top">
          <div>
            <span class="order-id">${escapeHtml(order.id)}</span>
            <span class="order-meta"> · ${escapeHtml(dateText)}</span>
          </div>
          <strong>${money(order.subtotal)}</strong>
        </div>
        <div class="order-body">
          <div class="order-customer">
            <p><strong>Customer:</strong> ${escapeHtml(order.customer?.name || 'Guest')}</p>
            <p><strong>Contact:</strong> ${escapeHtml(order.customer?.contact || '—')}</p>
            <p><strong>Address:</strong> ${escapeHtml(order.customer?.address || '—')}</p>
          </div>
          <div class="order-items">
            <p><strong>Items:</strong></p>
            <ul>${itemsHtml}</ul>
          </div>
        </div>
        <div class="order-controls">
          <label>Status:
            <select data-order-status="${escapeHtml(order.id)}">
              ${['New', 'Processing', 'Completed', 'Cancelled'].map(st => `<option value="${st}"${order.status === st ? ' selected' : ''}>${st}</option>`).join('')}
            </select>
          </label>
          <button class="mini-btn danger" type="button" data-delete-order="${escapeHtml(order.id)}">Delete Order</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderAll() {
  const products = loadProducts();
  const orders = loadOrders();
  renderStats(products, orders);
  renderProductList(products);
  renderOrdersList(orders);
}

function resetProductForm() {
  $('#productForm').reset();
  $('#editingProductId').value = '';
  $('#formHeading').innerHTML = 'Add New <em>Product</em>';
  $('#saveProductBtn').innerHTML = 'SAVE PRODUCT <span>↗</span>';
  $('#cancelEditButton').hidden = true;
  $('#prodColors').value = '#3A2118, #B69B80';
  $('#prodBadge').value = 'NEW ARRIVAL';
  $('#prodImageUrl').value = 'assets/product-jacket.svg';
  $('#previewImg').src = 'assets/product-jacket.svg';
  $('#previewText').textContent = 'Default image selected — or upload your own photo above.';
}

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      if (file.type === 'image/svg+xml') {
        resolve(reader.result);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const maxSide = 800;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const user = $('#loginUsername').value.trim();
  const pass = $('#loginPassword').value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    $('#loginError').hidden = true;
    $('#loginForm').reset();
    setAuthState(true);
    showToast('Welcome back, admin.');
  } else {
    $('#loginError').textContent = 'Invalid username or password. Try admin / 12345.';
    $('#loginError').hidden = false;
  }
});

$('#logoutButton').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  setAuthState(false);
  showToast('Signed out.');
});

$$('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    $$('.tab-btn').forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    $('#productsTab').hidden = target !== 'products';
    $('#ordersTab').hidden = target !== 'orders';
  });
});

$('#prodImageFile').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImageFile(file);
    $('#prodImageUrl').value = dataUrl;
    $('#previewImg').src = dataUrl;
    $('#previewText').textContent = `Uploaded: ${file.name}`;
  } catch (error) {
    showToast('Could not load that image.');
  }
});

$('#prodImageUrl').addEventListener('input', event => {
  const val = event.target.value.trim() || 'assets/product-jacket.svg';
  $('#previewImg').src = val;
  $('#previewText').textContent = 'Using custom image path / URL.';
});

$('#cancelEditButton').addEventListener('click', resetProductForm);

$('#productForm').addEventListener('submit', event => {
  event.preventDefault();
  const products = loadProducts();
  const editId = $('#editingProductId').value;
  const name = $('#prodName').value.trim();
  const price = Number($('#prodPrice').value);
  const colors = $('#prodColors').value.split(',').map(c => c.trim()).filter(Boolean);
  const productData = {
    id: editId || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'}-${Date.now().toString().slice(-4)}`,
    name,
    category: $('#prodCategory').value,
    type: $('#prodType').value.trim(),
    price: Number.isFinite(price) && price > 0 ? price : 1,
    image: $('#prodImageUrl').value.trim() || 'assets/product-jacket.svg',
    badge: ($('#prodBadge').value.trim() || 'NEW ARRIVAL').toUpperCase(),
    colors: colors.length ? colors : ['#3A2118'],
    description: $('#prodDescription').value.trim()
  };

  if (editId) {
    const index = products.findIndex(item => item.id === editId);
    if (index !== -1) products[index] = productData;
  } else {
    products.unshift(productData);
  }

  try {
    saveProducts(products);
  } catch (error) {
    showToast('Image is too large for browser storage. Try a smaller photo.');
    return;
  }
  resetProductForm();
  renderAll();
  showToast(editId ? 'Product updated.' : 'Product added to storefront.');
});

$('#adminProductList').addEventListener('click', event => {
  const editId = event.target.closest('[data-edit]')?.dataset.edit;
  if (editId) {
    const product = loadProducts().find(item => item.id === editId);
    if (!product) return;
    $('#editingProductId').value = product.id;
    $('#prodName').value = product.name;
    $('#prodCategory').value = product.category;
    $('#prodPrice').value = product.price;
    $('#prodType').value = product.type;
    $('#prodBadge').value = product.badge || '';
    $('#prodColors').value = (product.colors || []).join(', ');
    $('#prodImageUrl').value = product.image;
    $('#previewImg').src = product.image;
    $('#previewText').textContent = 'Editing existing product image.';
    $('#prodDescription').value = product.description;
    $('#formHeading').innerHTML = 'Edit <em>Product</em>';
    $('#saveProductBtn').innerHTML = 'UPDATE PRODUCT <span>↗</span>';
    $('#cancelEditButton').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const deleteId = event.target.closest('[data-delete]')?.dataset.delete;
  if (deleteId) {
    const products = loadProducts().filter(item => item.id !== deleteId);
    saveProducts(products);
    if ($('#editingProductId').value === deleteId) resetProductForm();
    renderAll();
    showToast('Product deleted.');
  }
});

$('#resetProductsBtn').addEventListener('click', () => {
  saveProducts([...defaultProducts]);
  resetProductForm();
  renderAll();
  showToast('Default NUOVA products restored.');
});

$('#ordersList').addEventListener('change', event => {
  const select = event.target.closest('[data-order-status]');
  if (!select) return;
  const orders = loadOrders();
  const order = orders.find(entry => entry.id === select.dataset.orderStatus);
  if (order) {
    order.status = select.value;
    saveOrders(orders);
    renderStats(loadProducts(), orders);
    showToast(`Order ${order.id} marked as ${order.status}.`);
  }
});

$('#ordersList').addEventListener('click', event => {
  const deleteOrderId = event.target.closest('[data-delete-order]')?.dataset.deleteOrder;
  if (!deleteOrderId) return;
  const orders = loadOrders().filter(entry => entry.id !== deleteOrderId);
  saveOrders(orders);
  renderAll();
  showToast('Order removed.');
});

$('#refreshOrdersBtn').addEventListener('click', () => {
  renderAll();
  showToast('Orders refreshed.');
});

window.addEventListener('storage', event => {
  if (sessionStorage.getItem(AUTH_KEY) === 'true' && (event.key === PRODUCTS_KEY || event.key === ORDERS_KEY)) {
    renderAll();
  }
});

setAuthState(sessionStorage.getItem(AUTH_KEY) === 'true');
