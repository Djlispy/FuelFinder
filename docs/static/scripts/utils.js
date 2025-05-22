// utils.js

export function formatPrice(price) {
  return price !== null && price !== undefined ? `$${price.toFixed(3)}` : 'N/A';
}
