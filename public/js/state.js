export const state = {
  user: JSON.parse(localStorage.getItem('chowlyUser') || 'null'),
  token: localStorage.getItem('chowlyToken'),
  restaurant: localStorage.getItem('chowlyRestaurant') || 'the-bukka',
  cart: []
};

export function saveState() {
  localStorage.setItem('chowlyUser', JSON.stringify(state.user));
  localStorage.setItem('chowlyToken', state.token || '');
  localStorage.setItem('chowlyRestaurant', state.restaurant);
}

export function clearCart() {
  state.cart = [];
}
