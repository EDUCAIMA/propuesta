import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('Main.jsx cargado correctamente');
window.onerror = function(msg, url, line, col, error) {
  console.error('Error global capturado:', msg, 'en', url, 'línea', line);
  alert('Error crítico: ' + msg);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
