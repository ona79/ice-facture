import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react'; 
import { IceInput } from '../components/IceInput';
import { toast } from 'react-hot-toast';

// --- CONFIGURATION DE L'URL API ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register() {
  // Ajout de 'confirmPassword' dans l'état initial
  const [formData, setFormData] = useState({ 
    shopName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    phone: '' 
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const validate = () => {
    let tempErrors = {};
    
    // Validation Boutique
    if (!formData.shopName.trim()) {
      tempErrors.shopName = "Le nom est requis.";
    } else if (/^\d/.test(formData.shopName.trim())) {
      tempErrors.shopName = "Le nom ne peut pas commencer par un chiffre.";
    } else if (formData.shopName.trim().length < 3) {
      tempErrors.shopName = "Minimum 3 caractères.";
    }

    // Validation Téléphone (STRICTEMENT 9 CHIFFRES)
    if (!formData.phone) {
      tempErrors.phone = "Le numéro est requis.";
    } else if (formData.phone.length !== 9) {
      tempErrors.phone = "Le numéro doit comporter exactement 9 chiffres.";
    }

    // Validation Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!formData.email) {
      tempErrors.email = "L'email est requis.";
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Email invalide (doit finir par .com)";
    }

    // Validation Mot de passe
    if (formData.password.length < 6) {
      tempErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
    }

    // --- NOUVELLE VALIDATION : CONFIRMATION MOT DE PASSE ---
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Veuillez confirmer le mot de passe.";
    } else if (formData.confirmPassword !== formData.password) {
      tempErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        // On envoie tout sauf confirmPassword au backend
        const { confirmPassword, ...dataToSend } = formData;
        await axios.post(`${API_URL}/api/auth/register`, dataToSend);
        
        toast.success("Inscription réussie !", {
          duration: 3000,
          style: {
            background: '#09090b',
            color: '#00f2ff',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
          }
        });

        setTimeout(() => {
          navigate('/login'); 
        }, 2000);

      } catch (err) {
        setErrors({ server: err.response?.data?.msg || "Erreur serveur" });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ice-900 font-sans">
      <div className="glass-card p-10 rounded-[3rem] w-full max-w-md border border-white/5 shadow-2xl relative overflow-hidden">
        
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-ice-400 rounded-2xl text-ice-900 mb-4 shadow-lg shadow-ice-400/20">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">Inscription</h1>
          <p className="text-ice-100/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 italic">Créez votre compte Ice-Facture</p>
        </div>

        {errors.server && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-6 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-red-500 text-[10px] font-bold uppercase italic">{errors.server}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NOM BOUTIQUE */}
          <div className="relative">
            <IceInput 
              label="Nom de la Boutique" 
              placeholder="Ex: VIP Store"
              value={formData.shopName}
              onChange={(e) => setFormData({...formData, shopName: e.target.value})}
            />
            {errors.shopName && (
              <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase italic tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> {errors.shopName}
              </p>
            )}
          </div>

          {/* TÉLÉPHONE */}
          <div className="relative">
            <IceInput 
              label="Numéro de Téléphone" 
              placeholder="77XXXXXXX"
              maxLength={9}
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})}
            />
            {errors.phone && (
              <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase italic tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> {errors.phone}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div className="relative">
            <IceInput 
              label="Email Professionnel" 
              type="email"
              placeholder="contact@boutique.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            {errors.email && (
              <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase italic tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> {errors.email}
              </p>
            )}
          </div>

          {/* MOT DE PASSE */}
          <div className="relative">
            <IceInput 
              label="Mot de passe" 
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            {errors.password && (
              <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase italic tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> {errors.password}
              </p>
            )}
          </div>

          {/* CONFIRMATION MOT DE PASSE (NOUVEAU) */}
          <div className="relative">
            <IceInput 
              label="Confirmer le mot de passe" 
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase italic tracking-tighter flex items-center gap-1">
                <AlertCircle size={10} /> {errors.confirmPassword}
              </p>
            )}
          </div>

          <button className="w-full bg-ice-400 text-ice-900 font-black py-4 rounded-2xl hover:bg-white transition-all shadow-xl shadow-ice-400/10 uppercase italic tracking-widest text-xs mt-4 group">
            S'inscrire <span className="inline-block group-hover:translate-x-1 transition-transform ml-1">→</span>
          </button>
        </form>

        <p className="text-center mt-10 text-[10px] text-ice-100/30 font-bold uppercase tracking-[0.1em]">
          Déjà inscrit ? <Link to="/login" className="text-ice-400 hover:text-white transition-colors ml-1 underline decoration-ice-400/30 underline-offset-4">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}