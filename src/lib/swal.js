import Swal from 'sweetalert2';

export const showSuccess = (title, text = '') =>
  Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#3085d6' });

export const showError = (title, text = '') =>
  Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#d33' });

export const showConfirm = async (title, text = '') =>
  Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
  });