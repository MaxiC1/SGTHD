import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <App />
  </React.StrictMode>
);