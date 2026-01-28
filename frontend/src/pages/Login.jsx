import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { IceInput } from '../components/IceInput';
import { toast } from 'react-hot-toast';

// --- CONFIGURATION DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  // Nettoyage automatique des messages d'erreurs rouges sous les champs
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // NETTOYAGE CRUCIAL : On force l'email en minuscules avant l'envoi
    const cleanData = {
      ...formData,
      email: formData.email.toLowerCase().trim(),
      password: formData.password.trim()
    };

    try {
      // Utilisation des données nettoyées pour éviter l'erreur 500 ou "Utilisateur non trouvé"
      const res = await axios.post(`${API_URL}/api/auth/login`, cleanData);

      // Stockage des informations
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role || 'admin');
      localStorage.setItem('shopName', res.data.user.shopName);

      toast.success("ACCÈS AUTORISÉ", {
        style: {
          background: '#09090b',
          color: '#00f2ff',
          border: '1px solid #00f2ff',
          fontSize: '10px',
          fontWeight: '900'
        }
      });

      // Redirection et rafraîchissement pour charger le token partout
      navigate('/dashboard');
      window.location.reload();

    } catch (err) {
      // Gestion des erreurs robuste
      const errorMsg = err.response?.data?.msg || "Erreur de connexion";

      // LOG pour déboguer si c'est une 500
      if (err.response?.status === 500) {
        console.error("ERREUR SERVEUR 500 : Vérifiez les logs Render et le JWT_SECRET");
      }

      // 1. SI L'UTILISATEUR EST INCONNU -> NOTIFICATION STYLISÉE ICE-CYAN
      if (errorMsg.includes("Utilisateur non trouvé") || errorMsg.includes("compte n'existe pas") || errorMsg.includes("invalides")) {
        toast(errorMsg.toUpperCase(), {
          icon: <AlertCircle size={16} color="#00f2ff" />,
          style: {
            background: 'rgba(0, 242, 255, 0.05)',
            color: '#00f2ff',
            border: '1px solid rgba(0, 242, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            borderRadius: '15px'
          }
        });
      }
      // 2. SI C'EST LE MOT DE PASSE -> SIGNALÉ SOUS LE CHAMP EN ROUGE
      else if (errorMsg.toLowerCase().includes("mot de passe")) {
        setErrors({ password: "Mot de passe incorrect" });
      }
      // PAR DÉFAUT
      else {
        setErrors({ email: errorMsg });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#060b13] font-sans">
      <div className="glass-card p-8 md:p-12 rounded-[3.5rem] w-full max-w-4xl border border-white/5 shadow-2xl relative overflow-hidden">

        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-ice-400/10 text-ice-400 rounded-2xl mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Connexion</h1>
          <p className="text-ice-100/40 text-[9px] font-bold uppercase tracking-[0.3em] mt-2 italic">kassa vous souhaite une bonne experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            {/* CHAMP EMAIL */}
            <div className="relative">
              <IceInput
                label="Email Professionnel"
                icon={<Mail size={16} />}
                type="email"
                placeholder="votre@boutique.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
              />
              {errors.email && (
                <p className="text-red-500 text-[8px] font-black mt-2 ml-1 uppercase italic flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle size={10} /> {errors.email}
                </p>
              )}
            </div>

            {/* CHAMP MOT DE PASSE */}
            <div className="relative">
              <IceInput
                label="Mot de passe"
                icon={<Lock size={16} />}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                ref={passwordRef}
              />
              {errors.password && (
                <p className="text-red-500 text-[8px] font-black mt-2 ml-1 uppercase italic flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle size={10} /> {errors.password}
                </p>
              )}
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" size={10} className="text-[9px] text-ice-100/30 font-bold uppercase hover:text-ice-400 transition-colors italic group flex items-center gap-1">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-2">
            <button type="submit" className="w-full md:w-72 bg-ice-400 text-ice-900 font-black py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-ice-400/20 uppercase italic text-xs flex items-center justify-center gap-2 group">
              Se connecter <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="mt-8 text-[9px] text-ice-100/30 font-bold uppercase tracking-widest">
              Pas de boutique ?
              <Link to="/register" className="text-ice-400 ml-2 hover:text-white underline underline-offset-4 decoration-ice-400/30">
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}