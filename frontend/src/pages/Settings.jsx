import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, Lock, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IceInput } from '../components/IceInput';
import toast from 'react-hot-toast';

export default function Settings() {
  const [formData, setFormData] = useState({ 
    shopName: '', 
    address: '', 
    phone: '', 
    footerMessage: '' 
  });
  
  // États de gestion
  const [isLocked, setIsLocked] = useState(true);
  const [accessPassword, setAccessPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({}); // Pour la validation visuelle
  
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  // Charger les données
  useEffect(() => {
    if (!isLocked) {
      axios.get('http://localhost:5000/api/auth/profile', config)
        .then(res => {
          setFormData({
            shopName: res.data.shopName || '',
            address: res.data.address || '',
            phone: res.data.phone || res.data.phoneNumber || '',
            footerMessage: res.data.footerMessage || ''
          });
          setErrors({}); 
        })
        .catch(err => {
          console.error("Erreur de récupération:", err);
          // Notification si la route GET /profile n'existe pas (404) ou serveur éteint
          toast.error("Erreur de récupération : La route serveur est introuvable (404).");
        });
    }
  }, [isLocked]);

  const handleVerifyAccess = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Vérification...");
    try {
      await axios.post('http://localhost:5000/api/auth/verify-password', { password: accessPassword }, config);
      toast.dismiss(loadingToast);
      setIsLocked(false);
      toast.success("Accès autorisé");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Mot de passe incorrect");
      setAccessPassword('');
    }
  };

  const validateForm = () => {
    let newErrors = {};
    // Notifications sur les champs pour la validation de saisie
    if (!formData.shopName || !formData.shopName.trim()) newErrors.shopName = "Le nom de la boutique est requis";
    if (!formData.phone || !formData.phone.trim()) newErrors.phone = "Le numéro de téléphone est requis";
    if (!formData.address || !formData.address.trim()) newErrors.address = "L'adresse est requise";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Sauvegarde en cours...");

    try {
      await axios.put('http://localhost:5000/api/auth/profile', formData, config);
      localStorage.setItem('shopName', formData.shopName);
      toast.dismiss(loadingToast);
      toast.success("Paramètres enregistrés !");
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      toast.dismiss(loadingToast);
      // Notifier l'utilisateur de la cause exacte de l'erreur de sauvegarde
      toast.error(err.response?.data?.message || "Erreur lors de la sauvegarde (Vérifiez votre route PUT).");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ÉCRAN VERROUILLÉ ---
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <div className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 shadow-2xl relative">
          <button onClick={() => navigate('/dashboard')} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20}/></button>
          <div className="flex flex-col items-center text-center">
            <div className="p-5 bg-ice-400/10 text-ice-400 rounded-3xl mb-6 shadow-inner"><Lock size={38} /></div>
            <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter">Zone Protégée</h3>
            <p className="text-ice-100/50 text-sm mb-8 leading-relaxed">Saisissez votre mot de passe pour accéder aux réglages.</p>
            <form onSubmit={handleVerifyAccess} className="w-full space-y-4">
              <IceInput 
                label="Mot de passe Admin" 
                type="password" 
                value={accessPassword} 
                onChange={(e) => setAccessPassword(e.target.value)}
                autoComplete="new-password"
                name={`field_${Math.random()}`}
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                required
              />
              <button type="submit" disabled={!accessPassword} className={`w-full py-5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${accessPassword ? 'bg-ice-400 text-ice-900 shadow-lg shadow-ice-400/20' : 'bg-white/5 text-white/20'}`}>
                <ShieldCheck size={18} /> Déverrouiller
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- FORMULAIRE DÉVERROUILLÉ ---
  return (
    <div className="p-4 max-w-2xl mx-auto min-h-screen text-white pb-10">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-ice-100/50 mb-8 font-bold uppercase text-[10px] tracking-widest hover:text-ice-400 transition-colors">
        <ArrowLeft size={14} /> Retour Dashboard
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">Configuration</h1>
        <p className="text-ice-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Édition des informations légales</p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 shadow-2xl">
        
        {/* NOM BOUTIQUE */}
        <div className="space-y-1">
          <IceInput 
            label="Nom de la boutique (Affiché sur facture)"
            value={formData.shopName}
            onChange={(e) => {
                setFormData({...formData, shopName: e.target.value});
                if(errors.shopName) setErrors({...errors, shopName: null});
            }}
            className={errors.shopName ? 'border-red-500 bg-red-500/10' : ''}
          />
          {errors.shopName && <p className="text-[9px] text-red-500 font-bold uppercase pl-2 flex items-center gap-1"><AlertTriangle size={10}/> {errors.shopName}</p>}
        </div>

        {/* TÉLÉPHONE */}
        <div className="space-y-1">
          <IceInput 
            label="Numéro de Téléphone"
            value={formData.phone}
            onChange={(e) => {
                setFormData({...formData, phone: e.target.value});
                if(errors.phone) setErrors({...errors, phone: null});
            }}
            className={errors.phone ? 'border-red-500 bg-red-500/10' : ''}
          />
          {errors.phone && <p className="text-[9px] text-red-500 font-bold uppercase pl-2 flex items-center gap-1"><AlertTriangle size={10}/> {errors.phone}</p>}
        </div>

        {/* ADRESSE */}
        <div className="space-y-1">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${errors.address ? 'text-red-500' : 'text-ice-100/40'}`}>Adresse physique</label>
          <textarea 
            className={`w-full bg-white/5 border rounded-2xl p-4 focus:border-ice-400 outline-none h-28 resize-none text-sm font-medium transition-all ${errors.address ? 'border-red-500 bg-red-500/10' : 'border-white/10'}`}
            placeholder="Ex: Avenue Cheikh Anta Diop, Dakar..."
            value={formData.address}
            onChange={(e) => {
                setFormData({...formData, address: e.target.value});
                if(errors.address) setErrors({...errors, address: null});
            }}
          />
          {errors.address && <p className="text-[9px] text-red-500 font-bold uppercase pl-2 flex items-center gap-1"><AlertTriangle size={10}/> {errors.address}</p>}
        </div>

        {/* MESSAGE PIED DE PAGE */}
        <IceInput 
          label="Message de remerciement (Pied de page)"
          value={formData.footerMessage}
          onChange={(e) => setFormData({...formData, footerMessage: e.target.value})}
        />

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all ${isSaving ? 'bg-white/10 text-white/20 cursor-wait' : 'bg-ice-400 text-ice-900 hover:bg-white hover:scale-[1.01] active:scale-95'}`}
          >
            {isSaving ? "CHARGEMENT..." : <><Save size={20} /> ENREGISTRER LES MODIFICATIONS</>}
          </button>
        </div>
      </form>
    </div>
  );
}