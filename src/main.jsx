import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (!document.getElementById('tailwind-cdn')) {
  const style = document.createElement('script');
  style.id = 'tailwind-cdn';
  style.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(style);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
