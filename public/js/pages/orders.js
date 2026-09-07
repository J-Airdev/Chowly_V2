import { state } from '../state.js';
import { api, query } from '../api.js';
import { toast } from '../utils.js';
import { setActivePage, navigate } from '../navigation.js';
import { orderCard } from '../components/order-card.js';

export async function ordersPage(payments = false) {
  setActivePage(payments ? 'payment' : 'orders');
  
  const app = document.querySelector('#app');
  
  try {
    let orders = await api(`/api/orders${query()}`);
    
    if (payments) {
      orders = orders.filter(x => !x.payment_id);
    }
    
    const roleWaiter = state.user?.role === 'waiter';
    
    app.innerHTML = `
      <section class="page-title">
        <p class="eyebrow">${payments ? 'PAYMENT DESK' : roleWaiter ? 'KITCHEN QUEUE' : 'ORDER TRACKER'}</p>
        <h2>${payments ? 'Settle an order' : roleWaiter ? 'Manage active orders' : 'Your orders'}</h2>
        <p>${payments ? 'Payments are clearly simulated for this Chowly demo.' : roleWaiter ? 'Assign kitchen and bar staff, then update service status.' : 'Follow your order from the kitchen to your table.'}</p>
      </section>
      <section class="order-list">
        ${orders.length ? orders.map(orderCard).join('') : '<div class="empty-panel">Nothing here yet. Return to the menu to begin.</div>'}
      </section>
    `;
    
    document.querySelectorAll('[data-order]').forEach(x => {
      x.onclick = () => navigate('orderDetail', x.dataset.order);
    });
  } catch (e) {
    toast(e.message);
  }
}
