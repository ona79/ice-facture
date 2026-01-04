import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { IceInput } from '../components/IceInput';

// --- CONFIGURATION DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Modification de l'URL pour pointer vers Render ou Localhost
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      
      // Stockage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('shopName', res.data.user.shopName);
      
      // Redirection et rechargement pour mettre à jour l'état Global
      navigate('/dashboard');
      window.location.reload(); 
    } catch (err) {
      console.error("Détails erreur login:", err.response);
      alert(err.response?.data?.msg || "Identifiants incorrects");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ice-900">
      <div className="glass-card p-10 rounded-[3rem] w-full max-w-md border-white/5">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-ice-400 rounded-2xl text-ice-900 mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Connexion</h1>
          <p className="text-ice-100/40 text-xs font-bold uppercase tracking-widest mt-2">Gérez vos ventes au Sénégal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <IceInput 
            label="Email" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <IceInput 
            label="Mot de passe" 
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          <button className="w-full bg-ice-400 text-ice-900 font-black py-4 rounded-2xl hover:bg-white transition-all shadow-xl uppercase">
            Se connecter
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-ice-100/40 font-bold uppercase tracking-tighter">
          Nouveau ? <Link to="/register" className="text-ice-400 hover:underline ml-1">Créer une boutique</Link>
        </p>
      </div>
    </div>
  );
}