import React from 'react'; // Import React
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'; // Import AuthProvider
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap everything with BrowserRouter */}
      <AuthProvider> {/* Wrap App with AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
