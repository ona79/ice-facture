import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewInvoice from './pages/NewInvoice';
import History from './pages/History'; // C'est ici que se trouve ton historique/factures
import Settings from './pages/Settings';

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      {/* Configuration fidèle de ton Toaster style "Glass" */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#161b22', 
            color: '#fff',         
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#22d3ee', secondary: '#161b22' },
            style: { border: '1px solid rgba(34, 211, 238, 0.3)' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#161b22' },
            style: { border: '1px solid rgba(239, 68, 68, 0.3)' },
          },
        }}
      />

      <Routes>
        {/* ROUTES PUBLIQUES */}
        <Route 
          path="/login" 
          element={!token ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!token ? <Register /> : <Navigate to="/dashboard" />} 
        />

        {/* ROUTES PRIVÉES (TOKEN REQUIS) */}
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/products" 
          element={token ? <Products /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/new-invoice" 
          element={token ? <NewInvoice /> : <Navigate to="/login" />} 
        />
        
        {/* C'est cette route qui affiche l'historique des factures */}
        <Route 
          path="/history" 
          element={token ? <History /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/settings" 
          element={token ? <Settings /> : <Navigate to="/login" />} 
        />

        {/* REDIRECTION PAR DÉFAUT */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;