import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Store, Mail, Lock } from 'lucide-react'; // Store au lieu de Shop
import { IceInput } from '../components/IceInput';

export default function Register() {
  const [formData, setFormData] = useState({ shopName: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert("Inscription réussie ! Connectez-vous maintenant.");
      navigate('/login'); 
    } catch (err) {
      alert(err.response?.data?.msg || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ice-900">
      <div className="glass-card p-10 rounded-[3rem] w-full max-w-md border-white/5">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-ice-400 rounded-2xl text-ice-900 mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Inscription</h1>
          <p className="text-ice-100/40 text-xs font-bold uppercase tracking-widest mt-2">Créez votre compte Ice-Facture</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <IceInput 
            label="Nom de la Boutique" 
            placeholder="Ex: VIP Store"
            value={formData.shopName}
            onChange={(e) => setFormData({...formData, shopName: e.target.value})}
            required
          />
          <IceInput 
            label="Email" 
            type="email"
            placeholder="contact@boutique.sn"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <IceInput 
            label="Mot de passe" 
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          <button className="w-full bg-ice-400 text-ice-900 font-black py-4 rounded-2xl hover:bg-white transition-all shadow-xl uppercase">
            S'inscrire
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-ice-100/40 font-bold uppercase tracking-tighter">
          Déjà inscrit ? <Link to="/login" className="text-ice-400 hover:underline ml-1">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}