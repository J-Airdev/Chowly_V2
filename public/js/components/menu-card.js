import { money, esc } from '../utils.js';

export function menuCard(item, index, readOnly = false) {
  const photo = item.image_url 
    ? `<div class="menu-photo" aria-label="${esc(item.name)}"><img src="${esc(item.image_url)}" alt="${esc(item.name)}" loading="lazy"></div>`
    : `<div class="dish-placeholder dish-${index % 6}" aria-label="Image placeholder for ${esc(item.name)}"><span>${item.category === 'drink' ? '✦' : '✳'}</span><small>Menu image</small></div>`;
    
  return `<article class="menu-card">
    ${photo}
    <div class="card-copy">
      <div class="line">
        <strong>${esc(item.name)}</strong>
        <b class="eta">${item.prep_minutes} min</b>
      </div>
      <p>${esc(item.description)}</p>
      <div class="line bottom">
        <strong>${money(item.price_cents)}</strong>
        ${readOnly ? '<span class="eta">Available</span>' : `<button data-add="${item.id}">Add</button>`}
      </div>
    </div>
  </article>`;
}
