export function formatearNumeroCL(num) {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return Number(num).toLocaleString('es-CL');
}

export const formatoMiles = (num) => {
  if (!num && num !== 0) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const desformatearMiles = (str) => {
  return parseInt(str.replace(/\./g, ''), 10) || 0;
};