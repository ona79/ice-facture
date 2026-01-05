import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewInvoice from './pages/NewInvoice';
import History from './pages/History'; 
import Settings from './pages/Settings';

// L'import de InvoiceDetail a été supprimé ici car le fichier n'existe plus

function App() {
  // On vérifie le token dynamiquement
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      {/* Configuration Toaster "Ice Glass" */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(9, 9, 11, 0.9)', 
            color: '#fff',         
            border: '1px solid rgba(0, 242, 255, 0.2)', 
            borderRadius: '24px', 
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backdropFilter: 'blur(12px)',
            padding: '16px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#00f2ff', secondary: '#09090b' },
            style: { border: '1px solid rgba(0, 242, 255, 0.4)', color: '#00f2ff' },
          },
          error: {
            iconTheme: { primary: '#ff4b4b', secondary: '#09090b' },
            style: { border: '1px solid rgba(255, 75, 75, 0.4)', color: '#ff4b4b' },
          },
        }}
      />

      <Routes>
        {/* ROUTES PUBLIQUES */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} 
        />

        {/* ROUTES PRIVÉES (TOKEN REQUIS) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/products" 
          element={isAuthenticated ? <Products /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/new-invoice" 
          element={isAuthenticated ? <NewInvoice /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/history" 
          element={isAuthenticated ? <History /> : <Navigate to="/login" />} 
        />

        {/* --- LA ROUTE /invoice/:id A ÉTÉ SUPPRIMÉE ICI --- */}
        {/* Les détails s'affichent maintenant en modal (petite fenêtre) dans History.jsx */}
        
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} 
        />

        {/* REDIRECTION PAR DÉFAUT */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
// --- FIN DU COMPOSANT APP ---