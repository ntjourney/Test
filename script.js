const state = { cart: [], openCategory: null, submitting: false };
const euro = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const $ = id => document.getElementById(id);

$('address').textContent = AZAD.contact.address;
$('footer-address').textContent = AZAD.contact.address;
$('notice').textContent = AZAD.notice;

const categories = [...new Set(AZAD.menu.map(item => item.category))];
const totalValue = () => state.cart.reduce((sum, entry) => sum + AZAD.menu[entry.index].price * entry.qty, 0);

function renderMenu() {
  $('categories').innerHTML = categories.map(category => {
    const expanded = state.openCategory === category;
    const products = AZAD.menu
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === category);
    return `<section class="accordion-item ${expanded ? 'is-open' : ''}">
      <button class="accordion-trigger" type="button" data-category="${category}" aria-expanded="${expanded}">
        <span>${category}</span><span class="accordion-icon" aria-hidden="true">+</span>
      </button>
      <div class="accordion-content" ${expanded ? '' : 'hidden'}>
        <div class="menu">${products.map(({ item, index }) => `<article class="item"><div><h3>${item.name}</h3><p>${item.description}</p><strong>${euro(item.price)}</strong></div><button class="add" type="button" data-index="${index}" aria-label="${item.name} in den Warenkorb">+</button></article>`).join('')}</div>
      </div>
    </section>`;
  }).join('');

  $('categories').querySelectorAll('.accordion-trigger').forEach(button => {
    button.addEventListener('click', () => {
      state.openCategory = state.openCategory === button.dataset.category ? null : button.dataset.category;
      renderMenu();
    });
  });
  $('categories').querySelectorAll('.add').forEach(button => button.addEventListener('click', () => add(Number(button.dataset.index))));
}

function add(index) {
  const found = state.cart.find(entry => entry.index === index);
  found ? found.qty += 1 : state.cart.push({ index, qty: 1 });
  renderCart();
}

function renderCart() {
  const box = $('cart-items');
  const total = totalValue();
  const checkout = $('checkout-button');
  if (!state.cart.length) {
    box.innerHTML = '<div class="empty-cart"><p>Dein Warenkorb ist leer</p><button id="show-menu" type="button" class="text-button">Speisekarte ansehen</button></div>';
    $('show-menu').addEventListener('click', () => $('bestellen').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } else {
    box.innerHTML = state.cart.map(entry => {
      const item = AZAD.menu[entry.index];
      const lineTotal = item.price * entry.qty;
      return `<div class="cart-row"><div><strong>${item.name}</strong><small>${euro(item.price)} pro Stück · ${euro(lineTotal)}</small></div><div class="quantity"><button type="button" data-change="-1" data-index="${entry.index}" aria-label="${item.name} reduzieren">−</button><span>${entry.qty}</span><button type="button" data-change="1" data-index="${entry.index}" aria-label="${item.name} erhöhen">+</button></div></div>`;
    }).join('');
    box.querySelectorAll('.quantity button').forEach(button => button.addEventListener('click', () => updateQuantity(Number(button.dataset.index), Number(button.dataset.change))));
  }
  $('subtotal').textContent = euro(total);
  $('total').textContent = euro(total);
  checkout.disabled = !state.cart.length;
  if (!state.cart.length) $('order-form').hidden = true;
}

function updateQuantity(index, change) {
  const entry = state.cart.find(item => item.index === index);
  if (!entry) return;
  entry.qty += change;
  if (entry.qty < 1) state.cart = state.cart.filter(item => item !== entry);
  renderCart();
}

function clearFieldErrors() {
  ['name', 'phone'].forEach(field => {
    $(`${field}-error`).textContent = '';
    $(field).removeAttribute('aria-invalid');
  });
}

function validateForm() {
  clearFieldErrors();
  const name = $('name').value.trim();
  const phone = $('phone').value.trim();
  let valid = true;
  if (!name) {
    $('name-error').textContent = 'Bitte gib deinen Namen ein.';
    $('name').setAttribute('aria-invalid', 'true');
    valid = false;
  }
  const phoneDigits = phone.replace(/[^\d]/g, '');
  if (!phone || phoneDigits.length < 7) {
    $('phone-error').textContent = 'Bitte gib deine Telefonnummer ein.';
    $('phone').setAttribute('aria-invalid', 'true');
    valid = false;
  }
  return valid;
}

function openModal(order) {
  $('success-order-id').textContent = order.id;
  $('success-name').textContent = order.name;
  $('success-phone').textContent = order.phone;
  $('success-total').textContent = euro(order.total);
  const modal = $('success-modal');
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.classList.add('is-visible'));
  $('.success-card').focus();
}

function closeModal() {
  const modal = $('success-modal');
  modal.classList.remove('is-visible');
  document.body.classList.remove('modal-open');
  window.setTimeout(() => { modal.hidden = true; }, 180);
}

function resetOrder() {
  state.cart = [];
  state.submitting = false;
  $('order-form').reset();
  clearFieldErrors();
  $('submit-order').disabled = false;
  $('submit-order').textContent = 'Bestellung bestätigen';
  renderCart();
}

$('checkout-button').addEventListener('click', () => {
  if (!state.cart.length) return;
  $('order-form').hidden = false;
  $('order-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('name').focus();
});

$('order-form').addEventListener('submit', event => {
  event.preventDefault();
  if (state.submitting || !state.cart.length || !validateForm()) return;
  state.submitting = true;
  const submit = $('submit-order');
  submit.disabled = true;
  submit.textContent = 'Bestellung wird simuliert...';
  const order = {
    id: `TEST-${Math.floor(10000 + Math.random() * 90000)}`,
    name: $('name').value.trim(),
    phone: $('phone').value.trim(),
    total: totalValue(),
    items: state.cart.map(entry => ({ ...entry })),
    createdAt: new Date().toISOString()
  };
  window.setTimeout(() => {
    try { localStorage.setItem('azad-demo-last-order', JSON.stringify(order)); } catch (_) {}
    openModal(order);
    state.submitting = false;
  }, 450);
});

$('[data-close-modal]').addEventListener('click', closeModal);
$('home-button').addEventListener('click', () => { closeModal(); resetOrder(); window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 190); });
$('new-order-button').addEventListener('click', () => { closeModal(); resetOrder(); window.setTimeout(() => $('bestellen').scrollIntoView({ behavior: 'smooth', block: 'start' }), 190); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('success-modal').hidden) closeModal(); });

renderMenu();
renderCart();