import { state } from '../state.js';
import { money, esc, toast } from '../utils.js';

let placeOrderHandler = null;

export function renderCart(onPlaceOrder) {
  if (onPlaceOrder) {
    placeOrderHandler = onPlaceOrder;
  }
  
  const box = document.querySelector('#cart');
  if (!box) return;
  
  const total = state.cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  
  box.innerHTML = `
    <p class="eyebrow">YOUR ORDER</p>
    <h3>Ready when you are</h3>
    ${state.cart.length ? state.cart.map(x => `
      <div class="cart-row">
        <div class="cart-item">
          <strong>${esc(x.name)}</strong>
          <div class="quantity-controls" aria-label="Change quantity for ${esc(x.name)}">
            <button type="button" class="quantity-button" data-decrease="${x.id}" aria-label="Remove one ${esc(x.name)}">−</button>
            <b>${x.quantity}</b>
            <button type="button" class="quantity-button" data-increase="${x.id}" aria-label="Add one ${esc(x.name)}">+</button>
          </div>
        </div>
        <strong>${money(x.price_cents * x.quantity)}</strong>
      </div>
    `).join('') : '<p class="empty">Your basket is empty. Add something delicious.</p>'}
    <div class="total">
      <strong>Total</strong>
      <strong>${money(total)}</strong>
    </div>
    <button class="wide" id="place-order" ${state.cart.length ? '' : 'disabled'}>
      Place order <span>→</span>
    </button>
  `;
  
  document.querySelectorAll('[data-decrease]').forEach(button => {
    button.onclick = () => changeCartItem(Number(button.dataset.decrease), -1);
  });
  
  document.querySelectorAll('[data-increase]').forEach(button => {
    button.onclick = () => changeCartItem(Number(button.dataset.increase), 1);
  });
  
  const placeOrderBtn = document.querySelector('#place-order');
  if (placeOrderBtn) {
    placeOrderBtn.onclick = placeOrderHandler;
  }
}

export function changeCartItem(id, change) {
  const item = state.cart.find(x => x.id === id);
  if (!item) return;
  
  if (change < 0 && item.quantity === 1) {
    state.cart = state.cart.filter(x => x.id !== id);
  } else if (change > 0 && item.quantity >= 20) {
    toast('You can order up to 20 of each item.');
  } else {
    item.quantity += change;
  }
  
  renderCart();
}
