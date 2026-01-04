import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import de la bibliothèque de notifications
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
      {/* Le Toaster est placé ici pour être disponible partout.
          J'ai configuré un style "Glass" sombre pour correspondre à tes captures.
      */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#161b22', // Fond sombre
            color: '#fff',         // Texte blanc
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
        <Route 
          path="/login" 
          element={!token ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!token ? <Register /> : <Navigate to="/dashboard" />} 
        />

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

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;