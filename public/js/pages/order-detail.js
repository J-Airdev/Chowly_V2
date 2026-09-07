import { state } from '../state.js';
import { api, query } from '../api.js';
import { toast, esc, money, dateTime } from '../utils.js';
import { navigate } from '../navigation.js';

export async function orderPage(id) {
  const app = document.querySelector('#app');
  
  try {
    const orders = await api(`/api/orders${query()}`);
    const order = orders.find(x => x.id === Number(id));
    
    if (!order) {
      return navigate('orders');
    }
    
    const isWaiter = state.user?.role === 'waiter';
    const locked = isWaiter && Boolean(order.customer_hidden_at);
    
    app.innerHTML = `
      <button class="back" id="back">← Back to orders</button>
      <section class="order-detail">
        <div class="detail-head">
          <div>
            <p class="eyebrow">ORDER #${order.id} · ${esc(order.restaurant_name)}</p>
            <h2>${order.status[0].toUpperCase() + order.status.slice(1)}</h2>
            <p>Ordered ${dateTime(order.created_at)} · Estimated waiting time: <b>${order.estimated_minutes} minutes</b>${order.table_number ? ` · ${esc(order.table_number)}` : ''}</p>
            ${locked ? '<p><b>Removed from customer history · This order is locked.</b></p>' : ''}
          </div>
          <div>
            <span class="status ${order.status}">${order.status}</span>
            <h3>${money(order.total_cents)}</h3>
          </div>
        </div>
        <div class="item-list">
          ${order.items.map(item => `
            <div>
              <span>${item.quantity}× ${esc(item.name)}</span>
              <span>${isWaiter ? (locked ? staffAssignments(item) : waiterFields(item)) : `${item.chef_name ? `Chef: ${esc(item.chef_name)}` : ''} ${item.bartender_name ? `Bar: ${esc(item.bartender_name)}` : ''}`}</span>
            </div>
          `).join('')}
        </div>
        ${isWaiter ? (locked ? lockedWaiterPanel() : waiterPanel()) : customerPanel(order)}
      </section>
    `;
    
    document.querySelector('#back').onclick = () => navigate('orders');
    
    if (isWaiter && !locked) {
      await setupWaiter(order);
    } else if (!isWaiter) {
      setupCustomer(order);
    }
  } catch (e) {
    toast(e.message);
  }
}

function waiterFields(i) {
  if (i.category === 'drink') {
    return `<select data-bartender="${i.id}"><option value="">Bartender</option></select>`;
  }
  return `<select data-chef="${i.id}"><option value="">Chef</option></select>`;
}

function staffAssignments(i) {
  if (i.category === 'drink') {
    return i.bartender_name ? `Bar: ${esc(i.bartender_name)}` : 'Bar: Unassigned';
  }
  return i.chef_name ? `Chef: ${esc(i.chef_name)}` : 'Chef: Unassigned';
}

function waiterPanel() {
  return `
    <div class="action-panel">
      <h3>Waiter controls</h3>
      <label>Order status</label>
      <select id="order-status">
        <option value="placed">Placed</option>
        <option value="preparing">Preparing</option>
        <option value="served">Served</option>
      </select>
      <button class="wide" id="save-service">Save preparation & service</button>
    </div>
  `;
}

function lockedWaiterPanel() {
  return `
    <div class="action-panel">
      <h3>Order locked</h3>
      <p>This paid order was removed from the customer’s history. Its service status and staff assignments are preserved and cannot be changed.</p>
    </div>
  `;
}

function customerPanel(o) {
  return `
    <div class="action-panel">
      ${o.complaint ? `
        <h3>Feedback saved</h3>
        <p>${o.complaint.rating}/5 rating${o.complaint.description ? ` · ${esc(o.complaint.description)}` : ''}</p>
      ` : `
        <h3>Delayed or disappointed?</h3>
        <label>Rating</label>
        <select id="rating">
          ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n} / 5</option>`).join('')}
        </select>
        <label>Complaint <small>(optional)</small></label>
        <textarea id="complaint" placeholder="Tell us what happened"></textarea>
        <button id="send-complaint" class="secondary wide">Save feedback</button>
      `}
      <hr>
      <p class="eyebrow">SIMULATED PAYMENT</p>
      ${o.payment_id ? `
        <h3>Payment recorded</h3>
        <p>Reference: ${esc(o.payment_reference)}</p>
        <button id="remove-order" class="secondary wide">Remove from my order history</button>
      ` : `
        <button id="pay" class="wide">Record pretend payment · ${money(o.total_cents)}</button>
      `}
    </div>
  `;
}

async function setupWaiter(o) {
  const staff = await api(`/api/staff${query()}`);
  
  for (const item of o.items) {
    const chef = document.querySelector(`[data-chef="${item.id}"]`);
    const bar = document.querySelector(`[data-bartender="${item.id}"]`);
    
    if (chef) {
      chef.innerHTML += staff.filter(x => x.role === 'chef').map(x => `<option value="${x.id}" ${x.id === item.chef_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    }
    if (bar) {
      bar.innerHTML += staff.filter(x => x.role === 'bartender').map(x => `<option value="${x.id}" ${x.id === item.bartender_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    }
  }
  
  document.querySelector('#order-status').value = o.status;
  
  document.querySelector('#save-service').onclick = async () => {
    try {
      const item_assignments = o.items.map(i => {
        const chefSelect = document.querySelector(`[data-chef="${i.id}"]`);
        const barSelect = document.querySelector(`[data-bartender="${i.id}"]`);
        return {
          id: i.id,
          chef_id: chefSelect ? (Number(chefSelect.value) || null) : null,
          bartender_id: barSelect ? (Number(barSelect.value) || null) : null
        };
      });
      
      await api(`/api/orders/${o.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: document.querySelector('#order-status').value,
          item_assignments
        })
      });
      
      toast('Order service updated.');
      navigate('orderDetail', o.id);
    } catch (e) {
      toast(e.message);
    }
  };
}

function setupCustomer(o) {
  document.querySelector('#send-complaint')?.addEventListener('click', async () => {
    try {
      await api(`/api/orders/${o.id}/complaints`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(document.querySelector('#rating').value),
          description: document.querySelector('#complaint').value
        })
      });
      toast('Feedback saved.');
      navigate('orderDetail', o.id);
    } catch (e) {
      toast(e.message);
    }
  });
  
  document.querySelector('#pay')?.addEventListener('click', async () => {
    try {
      await api(`/api/orders/${o.id}/payments`, {
        method: 'POST',
        body: '{}'
      });
      toast('Pretend payment recorded.');
      navigate('orderDetail', o.id);
    } catch (e) {
      toast(e.message);
    }
  });
  
  document.querySelector('#remove-order')?.addEventListener('click', async () => {
    if (!confirm('Remove this paid order from your history? The restaurant will retain its record.')) return;
    
    try {
      await api(`/api/orders/${o.id}`, {
        method: 'DELETE'
      });
      toast('Order removed from your history.');
      navigate('orders');
    } catch (e) {
      toast(e.message);
    }
  });
}
