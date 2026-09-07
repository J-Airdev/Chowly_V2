import { state, clearCart } from '../state.js';
import { api, query } from '../api.js';
import { toast, esc } from '../utils.js';
import { setActivePage, navigate } from '../navigation.js';
import { menuCard } from '../components/menu-card.js';
import { renderCart } from '../components/cart.js';

export async function menuPage() {
  const isWaiter = state.user?.role === 'waiter';
  setActivePage('menu');
  
  const app = document.querySelector('#app');
  
  try {
    const data = await api(`/api/menu${query()}`);
    document.querySelector('#restaurant-name').textContent = data.restaurant.name;
    
    app.innerHTML = `
      <section class="intro">
        <div>
          <p class="eyebrow">${isWaiter ? 'MENU VIEW' : 'TABLE SERVICE, SIMPLIFIED'}</p>
          <h2>${isWaiter ? 'Restaurant menu' : 'Pick a plate.<br>We’ll handle the rest.'}</h2>
          <p>${isWaiter ? `View the live menu for ${esc(data.restaurant.name)}.` : `Order directly from ${esc(data.restaurant.name)}. Your waiting time stays visible from kitchen to table.`}</p>
        </div>
        ${isWaiter ? '' : `
          <div class="table-field">
            <label>Table number <small>(optional)</small></label>
            <input id="table-number" placeholder="e.g. Table 04">
          </div>
        `}
      </section>
      <section class="menu-layout">
        <div>
          <h3>Food</h3>
          <div class="menu-grid">
            ${data.items.filter(x => x.category === 'food').map((item, index) => menuCard(item, index, isWaiter)).join('')}
          </div>
          <h3>Drinks</h3>
          <div class="menu-grid">
            ${data.items.filter(x => x.category === 'drink').map((item, index) => menuCard(item, index, isWaiter)).join('')}
          </div>
        </div>
        ${isWaiter ? '' : '<aside class="cart" id="cart"></aside>'}
      </section>
    `;
    
    if (!isWaiter) {
      document.querySelectorAll('[data-add]').forEach(button => {
        button.onclick = () => {
          const item = data.items.find(x => x.id === Number(button.dataset.add));
          const old = state.cart.find(x => x.id === item.id);
          if (old) {
            old.quantity++;
          } else {
            state.cart.push({ ...item, quantity: 1 });
          }
          renderCart(placeOrder);
        };
      });
      renderCart(placeOrder);
    }
  } catch (e) {
    toast(e.message);
  }
}

async function placeOrder() {
  if (state.user?.role !== 'customer') {
    return toast('Switch to Customer mode to place an order.');
  }
  
  try {
    const tableNumberInput = document.querySelector('#table-number');
    const order = await api(`/api/orders${query()}`, {
      method: 'POST',
      body: JSON.stringify({
        items: state.cart,
        table_number: tableNumberInput?.value
      })
    });
    
    clearCart();
    toast('Order placed. Your kitchen ticket is live.');
    navigate('orderDetail', order.id);
  } catch (e) {
    toast(e.message);
  }
}
