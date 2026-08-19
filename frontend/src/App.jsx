import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes/AppRoutes';
import { ServerWarmupBanner } from './components/common/ServerWarmupBanner';

// Liberty Tours & Travels ERP Root Component v1.0.1
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ServerWarmupBanner />
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
