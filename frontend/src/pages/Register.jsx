
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle, Store, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import { IceInput } from '../components/IceInput';
import { PhoneInput } from '../components/PhoneInput';
import { COUNTRY_CODES } from '../utils/countryCodes';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Register() {
  const [formData, setFormData] = useState({
    shopName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const validate = () => {
    let tempErrors = {};
    if (!formData.shopName.trim()) tempErrors.shopName = "Le nom est requis.";

    // Validation téléphone par pays
    if (!formData.phone) {
      tempErrors.phone = "Le numéro est requis.";
    } else if (selectedCountry) {
      if (formData.phone.length !== selectedCountry.digitLength) {
        tempErrors.phone = `${selectedCountry.digitLength} chiffres requis.`;
      } else {
        const hasValidPrefix = selectedCountry.prefixes.some(p => formData.phone.startsWith(p));
        if (!hasValidPrefix) {
          tempErrors.phone = "Préfixe incorrect.";
        }
      }
    } else if (formData.phone.length < 7) {
      tempErrors.phone = "Numéro trop court.";
    }

    // Validation email stricte : uniquement @gmail.com
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Un compte Gmail est requis (@gmail.com).";

      // Notification stylisée pour l'erreur Google
      toast("COMPTE GMAIL REQUIS", {
        icon: <AlertCircle size={16} color="#00f2ff" />,
        style: {
          background: 'rgba(0, 242, 255, 0.05)',
          color: '#00f2ff',
          border: '1px solid rgba(0, 242, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase',
          borderRadius: '15px'
        }
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formData.password)) tempErrors.password = "Mini 6 car. (Lettres+Chiffres)";

    if (formData.confirmPassword !== formData.password) tempErrors.confirmPassword = "Les mots de passe diffèrent.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const { confirmPassword, ...dataToSend } = formData;

        // RECONNAISSANCE : On force l'email en minuscules avant l'envoi au backend
        const finalData = {
          ...dataToSend,
          email: dataToSend.email.toLowerCase().trim(),
          password: dataToSend.password.trim()
        };

        await axios.post(`${API_URL}/api/auth/register`, finalData);

        toast.success("COMPTE CRÉÉ !", {
          style: { background: '#09090b', color: '#00f2ff', border: '1px solid #00f2ff', fontSize: '10px', fontWeight: '900' }
        });

        // Redirection après succès
        setTimeout(() => navigate('/login'), 2000);

      } catch (err) {
        const msg = err.response?.data?.msg || "ERREUR SERVEUR";

        // Notification stylisée ICE si l'email ou le téléphone existe déjà
        toast(msg.toUpperCase(), {
          icon: <AlertCircle size={16} color="#00f2ff" />,
          style: {
            background: 'rgba(0, 242, 255, 0.05)',
            color: '#00f2ff',
            border: '1px solid rgba(0, 242, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase',
            borderRadius: '15px'
          }
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#060b13] font-sans">
      <div className="glass-card p-8 md:p-12 rounded-[3.5rem] w-full max-w-4xl border border-white/5 shadow-2xl relative overflow-hidden">

        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-ice-400/10 text-ice-400 rounded-2xl mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Inscription</h1>
          <p className="text-ice-100/40 text-[9px] font-bold uppercase tracking-[0.3em] mt-2 italic">kassa vous souhaite une belle experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            {/* COLONNE GAUCHE */}
            <div className="space-y-5">
              <div className="relative">
                <IceInput
                  label="Boutique"
                  icon={<Store size={16} />}
                  placeholder="Donnez le nom de votre boutique..."
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      emailRef.current?.focus();
                    }
                  }}
                />
                {errors.shopName && <p className="text-red-500 text-[8px] font-black mt-1 uppercase italic animate-pulse">{errors.shopName}</p>}
              </div>

              <div className="relative">
                <IceInput
                  label="Email"
                  icon={<Mail size={16} />}
                  type="email"
                  placeholder="boutique@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  ref={emailRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      phoneRef.current?.focus();
                    }
                  }}
                />
                {errors.email && <p className="text-red-500 text-[8px] font-black mt-1 uppercase italic animate-pulse">{errors.email}</p>}
              </div>

              <div className="relative">
                <PhoneInput
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  onCountryChange={(country) => setSelectedCountry(country)}
                  error={errors.phone}
                  ref={phoneRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                />
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div className="space-y-5">
              <div className="relative">
                <IceInput
                  label="Mot de passe"
                  icon={<Lock size={16} />}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  ref={passwordRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmRef.current?.focus();
                    }
                  }}
                />
                {errors.password && <p className="text-red-500 text-[8px] font-black mt-1 uppercase italic animate-pulse">{errors.password}</p>}
              </div>

              <div className="relative">
                <IceInput
                  label="Confirmation"
                  icon={<ShieldCheck size={16} />}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  ref={confirmRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                {errors.confirmPassword && <p className="text-red-500 text-[8px] font-black mt-1 uppercase italic animate-pulse">{errors.confirmPassword}</p>}
              </div>

              <div className="hidden md:block p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] text-ice-100/30 uppercase font-black leading-relaxed">Sécurité : Utilisez un mélange de lettres et de chiffres (au moins 6 car.).</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-4">
            <button type="submit" className="w-full md:w-72 bg-ice-400 text-ice-900 font-black py-4 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-ice-400/20 uppercase italic text-xs">
              Valider l'inscription →
            </button>

            <p className="mt-6 text-[9px] text-ice-100/30 font-bold uppercase tracking-widest">
              Déjà membre ? <Link to="/login" className="text-ice-400 ml-1 hover:text-white underline underline-offset-4">Connexion</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}