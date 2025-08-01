import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster position="top-right" reverseOrder={false} />;
}