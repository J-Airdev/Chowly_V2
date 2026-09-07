import { state } from './state.js';

export async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    }
  });
  
  const data = res.status === 204 ? null : await res.json();
  
  if (!res.ok) {
    throw new Error(data?.error || 'Something went wrong.');
  }
  
  return data;
}

export function query() {
  return `?restaurant=${encodeURIComponent(state.restaurant)}`;
}
