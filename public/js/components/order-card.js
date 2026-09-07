import { state } from '../state.js';
import { money, esc, dateTime } from '../utils.js';

export function orderCard(o) {
  return `<article class="order-card">
    <div>
      <p class="eyebrow">ORDER #${o.id} · ${esc(o.restaurant_name)}</p>
      <h3>${o.items.map(i => `${i.quantity}× ${esc(i.name)}`).join(' · ')}</h3>
      <p>
        ${o.estimated_minutes} min estimate · Ordered ${dateTime(o.created_at)}
        ${o.table_number ? ` · ${esc(o.table_number)}` : ''}
        ${state.user?.role === 'waiter' && o.customer_hidden_at ? ' · Removed from customer history' : ''}
      </p>
    </div>
    <div class="order-side">
      <span class="status ${o.status}">${o.status}</span>
      <strong>${money(o.total_cents)}</strong>
      <button data-order="${o.id}">Open</button>
    </div>
  </article>`;
}
