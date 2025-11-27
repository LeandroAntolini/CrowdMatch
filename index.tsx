import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ToastProvider from './src/components/ToastProvider'; // Importar o ToastProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider /> {/* Adicionar o ToastProvider aqui */}
    <App />
  </React.StrictMode>
);