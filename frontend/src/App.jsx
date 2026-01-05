import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewInvoice from './pages/NewInvoice';
import History from './pages/History'; 
import Settings from './pages/Settings';

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      {/* Configuration fidèle et stylisée de ton Toaster "Ice Glass" */}
      <Toaster 
        position="top-center" // Centré en haut pour plus d'impact
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(9, 9, 11, 0.9)', // Fond très sombre (Ice-900)
            color: '#fff',         
            border: '1px solid rgba(0, 242, 255, 0.2)', // Bordure Cyan légère
            borderRadius: '24px', // Plus arrondi pour coller à tes inputs
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backdropFilter: 'blur(12px)',
            padding: '16px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { 
              primary: '#00f2ff', // Cyan Ice-400
              secondary: '#09090b' 
            },
            style: { 
              border: '1px solid rgba(0, 242, 255, 0.4)',
              color: '#00f2ff'
            },
          },
          error: {
            iconTheme: { 
              primary: '#ff4b4b', 
              secondary: '#09090b' 
            },
            style: { 
              border: '1px solid rgba(255, 75, 75, 0.4)',
              color: '#ff4b4b'
            },
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