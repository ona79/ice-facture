import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, Lock, X, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Settings() {
  const [formData, setFormData] = useState({ 
    shopName: '', 
    address: '', 
    phone: '', 
    footerMessage: '' 
  });

  const [passData, setPassData] = useState({ 
    oldPassword: '', 
    newPassword: '', 
    confirmPassword: '' // Ajout du champ confirmation
  });

  const [isLocked, setIsLocked] = useState(true);
  const [accessPassword, setAccessPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({}); 
  
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  useEffect(() => {
    if (!isLocked) {
      axios.get(`${API_URL}/api/auth/profile`, config)
        .then(res => {
          setFormData({
            shopName: res.data.shopName || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            footerMessage: res.data.footerMessage || ''
          });
        })
        .catch(() => toast.error("Erreur de récupération"));
    }
  }, [isLocked]);

  const handleVerifyAccess = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/verify-password`, { password: accessPassword }, config);
      setIsLocked(false);
      toast.success("Accès autorisé");
    } catch (err) {
      toast.error("Mot de passe incorrect");
      setAccessPassword('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let sErrors = {};

    if (!formData.shopName.trim()) sErrors.shopName = "Le nom est obligatoire";
    
    // Validation Téléphone STRICT (9 chiffres)
    if (formData.phone.length !== 9) {
      sErrors.phone = "Le numéro doit comporter exactement 9 chiffres.";
    }

    if (Object.keys(sErrors).length > 0) {
      setErrors(sErrors);
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/api/auth/profile`, formData, config);
      toast.success("Profil enregistré");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    let pErrors = {};
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,8}$/;

    // Validation Nouveau MDP
    if (!passwordRegex.test(passData.newPassword)) {
      pErrors.newPassword = "Doit contenir lettres/chiffres (6-8 caractères).";
    }

    // Validation Confirmation
    if (passData.newPassword !== passData.confirmPassword) {
      pErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    if (Object.keys(pErrors).length > 0) {
      setErrors(pErrors);
      return;
    }

    try {
      await axios.put(`${API_URL}/api/auth/update-password`, {
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword
      }, config);
      
      toast.success("Sécurité mise à jour");
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors({ auth: err.response?.data?.msg || "Ancien mot de passe incorrect" });
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <div className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 shadow-2xl relative">
          <button onClick={() => navigate('/dashboard')} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20}/></button>
          <div className="flex flex-col items-center text-center">
            <div className="p-5 bg-ice-400/10 text-ice-400 rounded-3xl mb-6 shadow-inner"><Lock size={38} /></div>
            <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter text-white">Accès Restreint</h3>
            <p className="text-ice-100/50 text-sm mb-8 leading-relaxed">Confirmez votre identité pour modifier les réglages.</p>
            <form onSubmit={handleVerifyAccess} className="w-full space-y-4 text-left">
              <IceInput 
                label="Mot de passe Admin" 
                type="password" 
                value={accessPassword} 
                onChange={(e) => setAccessPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button type="submit" className="w-full py-5 rounded-2xl bg-ice-400 text-ice-900 font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-ice-400/20">
                <ShieldCheck size={18} /> Déverrouiller
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto min-h-screen text-white pb-10 font-sans">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 mb-8 font-bold uppercase text-[10px] tracking-widest hover:text-ice-400 transition-colors">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Configuration</h1>
        <p className="text-ice-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic opacity-50">Personnalisation & Sécurité du compte</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* IDENTITÉ BOUTIQUE */}
        <form onSubmit={handleSaveProfile} className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 shadow-2xl text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-ice-400/10 rounded-lg"><Save size={18} className="text-ice-400" /></div>
            <h2 className="text-sm font-black uppercase italic tracking-widest">Identité Boutique</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <IceInput label="Nom de la boutique" value={formData.shopName} onChange={(e) => setFormData({...formData, shopName: e.target.value})} />
              {errors.shopName && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10}/> {errors.shopName}</p>}
            </div>
            
            <div>
              <IceInput 
                label="Téléphone (9 chiffres)" 
                maxLength={9} 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, "")})} 
              />
              {errors.phone && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10}/> {errors.phone}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-ice-100/40">Adresse physique</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-ice-400 outline-none h-24 resize-none text-sm transition-all"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <IceInput label="Message pied de page" value={formData.footerMessage} onChange={(e) => setFormData({...formData, footerMessage: e.target.value})} />
          </div>

          <button disabled={isSaving} className="w-full bg-ice-400 text-ice-900 font-black py-4 rounded-2xl uppercase text-xs hover:bg-white transition-all shadow-xl shadow-ice-400/5 mt-4">
            {isSaving ? "Traitement..." : "Enregistrer les infos"}
          </button>
        </form>

        {/* SÉCURITÉ MOT DE PASSE */}
        <form onSubmit={handleChangePassword} className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg"><KeyRound size={18} className="text-red-500" /></div>
            <h2 className="text-sm font-black uppercase italic tracking-widest text-white">Sécurité du compte</h2>
          </div>

          <div className="space-y-4">
            <div>
              <IceInput 
                label="Ancien mot de passe" 
                type="password" 
                value={passData.oldPassword} 
                onChange={(e) => setPassData({...passData, oldPassword: e.target.value})}
                autoComplete="off"
                required
              />
              {errors.auth && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10}/> {errors.auth}</p>}
            </div>

            <div className="h-px bg-white/5 mx-4 my-2"></div>

            <div>
              <IceInput 
                label="Nouveau mot de passe" 
                type="password" 
                maxLength={8}
                value={passData.newPassword} 
                onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                placeholder="6-8 car. (A-z + 0-9)"
                required
              />
              {errors.newPassword && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10}/> {errors.newPassword}</p>}
            </div>

            <div>
              <IceInput 
                label="Confirmer nouveau mot de passe" 
                type="password" 
                maxLength={8}
                value={passData.confirmPassword} 
                onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                required
              />
              {errors.confirmPassword && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10}/> {errors.confirmPassword}</p>}
            </div>
          </div>

          <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase text-[10px] transition-all italic tracking-widest mt-4">
            Mettre à jour la sécurité
          </button>
        </form>

      </div>
    </div>
  );
}