import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, Lock, X, ShieldCheck, AlertTriangle, KeyRound, Mail, Store, Trash2, UserPlus, Users, Phone, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IceInput } from '../components/IceInput';
import { PhoneInput } from '../components/PhoneInput';
import { COUNTRY_CODES } from '../utils/countryCodes';
import toast from 'react-hot-toast';

// Utilisation de l'URL API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Settings() {
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    phone: '',
    email: '',
    footerMessage: ''
  });

  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLocked, setIsLocked] = useState(true);
  const [accessPassword, setAccessPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'employees' or 'support'
  const [employeeData, setEmployeeData] = useState({ email: '', password: '', phone: '' });
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showDeleteEmployeeModal, setShowDeleteEmployeeModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  // Correction : Fonction pour récupérer le token frais à chaque appel
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => setErrors({}), 4000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // Récupération des données du profil après déverrouillage
  useEffect(() => {
    if (!isLocked) {
      axios.get(`${API_URL}/api/auth/profile`, getAuthHeader())
        .then(res => {
          setFormData({
            shopName: res.data.shopName || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            footerMessage: res.data.footerMessage || ''
          });
          if (res.data.role) {
            localStorage.setItem('role', res.data.role);
          }
        })
        .catch(() => toast.error("Erreur de récupération du profil"));
    }
  }, [isLocked]);

  useEffect(() => {
    if (activeTab === 'employees' && !isLocked) {
      fetchEmployees();
    }
  }, [activeTab, isLocked]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/employees`, getAuthHeader());
      setEmployees(res.data);
    } catch (err) {
      toast.error("Erreur de récupération des employés");
    }
  };

  const handleVerifyAccess = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Vérification...");
    try {
      await axios.post(`${API_URL}/api/auth/verify-password`, { password: accessPassword.trim() }, getAuthHeader());
      setIsLocked(false);
      toast.dismiss(loading);
      toast.success("Accès autorisé");
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Mot de passe incorrect");
      setAccessPassword('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let sErrors = {};
    if (!formData.shopName.trim()) sErrors.shopName = "Le nom est obligatoire";

    // Validation Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      sErrors.email = "Un compte Gmail (@gmail.com) est requis.";
    }

    if (formData.phone && selectedCountry) {
      if (formData.phone.length !== selectedCountry.digitLength) {
        sErrors.phone = `${selectedCountry.digitLength} chiffres requis.`;
      } else {
        const hasValidPrefix = selectedCountry.prefixes.some(p => formData.phone.startsWith(p));
        if (!hasValidPrefix) sErrors.phone = "Préfixe incorrect.";
      }
    } else if (formData.phone && formData.phone.length < 7) {
      sErrors.phone = "Numéro trop court.";
    }

    if (Object.keys(sErrors).length > 0) {
      setErrors(sErrors);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSave = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Finalisation de l'enregistrement...");
    try {
      // 1. Vérifier le mot de passe
      await axios.post(`${API_URL}/api/auth/verify-password`, { password: confirmPassword.trim() }, getAuthHeader());

      // 2. Enregistrer le profil
      setIsSaving(true);
      await axios.put(`${API_URL}/api/auth/profile`, formData, getAuthHeader());

      localStorage.setItem('shopName', formData.shopName);
      toast.dismiss(loading);
      toast.success("Profil mis à jour !");

      // 3. Redirection directe sur le dashboard
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Erreur de validation ou sauvegarde");
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
      setConfirmPassword('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    let pErrors = {};
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(passData.newPassword)) {
      pErrors.newPassword = "Doit contenir lettres/chiffres (min 6 caractères).";
    }
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
      }, getAuthHeader());

      toast.success("Sécurité mise à jour");
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setErrors({ auth: err.response?.data?.msg || "Ancien mot de passe incorrect" });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) return toast.error("Le mot de passe est requis");

    const loading = toast.loading("Suppression du compte en cours...");
    try {
      await axios.delete(`${API_URL}/api/auth/profile`, {
        ...getAuthHeader(),
        data: { password: deletePassword }
      });

      toast.dismiss(loading);
      toast.success("Compte supprimé avec succès");

      // Déconnexion complète
      localStorage.clear();
      sessionStorage.clear();

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Erreur lors de la suppression");
      setDeletePassword('');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Création...");
    try {
      await axios.post(`${API_URL}/api/auth/create-employee`, employeeData, getAuthHeader());
      toast.dismiss(loading);
      toast.success("Compte employé créé");
      setEmployeeData({ email: '', password: '', phone: '' });
      setShowAddEmployee(false);
      fetchEmployees();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Erreur de création");
    }
  };

  const handleDeleteEmployee = (id) => {
    setEmployeeToDelete(id);
    setDeletePassword(''); // Reset password field
    setShowDeleteEmployeeModal(true);
  };

  const confirmEmployeeDeletion = async (e) => {
    e.preventDefault(); // Prevent form submission reload
    if (!employeeToDelete) return;
    if (!deletePassword) {
      toast.error("Mot de passe requis");
      return;
    }

    const loading = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/api/auth/employees/${employeeToDelete}`, {
        ...getAuthHeader(),
        data: { password: deletePassword }
      });
      toast.dismiss(loading);
      toast.success("Vendeur supprimé");
      fetchEmployees();
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.msg || "Erreur lors de la suppression");
    } finally {
      setShowDeleteEmployeeModal(false);
      setEmployeeToDelete(null);
    }
  };

  const isEmployee = localStorage.getItem('role') === 'employee';

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <div className="glass-card w-full max-w-md p-8 rounded-[3rem] border-white/10 shadow-2xl relative bg-white/5">
          <button onClick={() => navigate('/dashboard')} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={20} /></button>
          <div className="flex flex-col items-center text-center">
            <div className="p-5 bg-ice-400/10 text-ice-400 rounded-3xl mb-6 shadow-inner"><Lock size={38} /></div>
            <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tighter text-white">Accès Restreint</h3>
            <p className="text-ice-100/50 text-sm mb-8 leading-relaxed">Confirmez votre identité pour modifier les réglages.</p>
            <form onSubmit={handleVerifyAccess} className="w-full space-y-4 text-left">
              <IceInput
                label="Saisir votre mot de passe"
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button type="submit" className="w-full py-5 rounded-2xl bg-ice-400 text-ice-900 font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-ice-400/20 active:scale-95 transition-all">
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

      {/* TABS FOR ADMIN */}
      {!isEmployee && (
        <div className="flex gap-4 mb-8 border-b border-white/5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 uppercase text-[10px] font-black tracking-widest transition-all ${activeTab === 'profile' ? 'text-ice-400 border-b-2 border-ice-400' : 'text-white/20 hover:text-white'}`}
          >
            Mon Profil
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-4 px-2 uppercase text-[10px] font-black tracking-widest transition-all ${activeTab === 'employees' ? 'text-ice-400 border-b-2 border-ice-400' : 'text-white/20 hover:text-white'}`}
          >
            Employés
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`pb-4 px-2 uppercase text-[10px] font-black tracking-widest transition-all ${activeTab === 'support' ? 'text-ice-400 border-b-2 border-ice-400' : 'text-white/20 hover:text-white'}`}
          >
            Support
          </button>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* IDENTITÉ BOUTIQUE */}
          <form onSubmit={handleSaveProfile} className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 shadow-2xl text-left bg-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-ice-400/10 rounded-lg"><Save size={18} className="text-ice-400" /></div>
              <h2 className="text-sm font-black uppercase italic tracking-widest">Identité Boutique</h2>
            </div>

            <div className="space-y-4">
              <div>
                <IceInput label="Nom de la boutique" icon={<Store size={18} />} placeholder="Donnez le nom de votre boutique..." value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} />
                {errors.shopName && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10} /> {errors.shopName}</p>}
              </div>

              <div>
                <IceInput label="Addresse Email" icon={<Mail size={18} />} placeholder="boutique@gmail.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                {errors.email && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic animate-in slide-in-from-top-1"><AlertTriangle size={10} /> {errors.email}</p>}
              </div>

              <div>
                <PhoneInput
                  label="Téléphone (9 chiffres)"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  onCountryChange={(country) => setSelectedCountry(country)}
                  error={errors.phone}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-ice-100/40 italic">Adresse de résidence</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-ice-400 outline-none h-16 resize-none text-sm transition-all text-white"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <IceInput label="Message pied de page" value={formData.footerMessage} onChange={(e) => setFormData({ ...formData, footerMessage: e.target.value })} />
            </div>

            <button disabled={isSaving} className="w-full bg-ice-400 text-ice-900 font-black py-4 rounded-2xl uppercase text-xs hover:bg-white transition-all shadow-xl shadow-ice-400/20 mt-4 active:scale-95">
              {isSaving ? "Traitement..." : "Enregistrer les infos"}
            </button>
          </form>

          {/* SÉCURITÉ MOT DE PASSE */}
          <form onSubmit={handleChangePassword} className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 shadow-2xl bg-white/5 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg"><KeyRound size={18} className="text-red-500" /></div>
              <h2 className="text-sm font-black uppercase italic tracking-widest text-white">Sécurité du compte</h2>
            </div>

            <div className="space-y-4">
              <div>
                <IceInput label="Ancien mot de passe" type="password" value={passData.oldPassword} onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })} required autoComplete="new-password" />
                {errors.auth && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic"><AlertTriangle size={10} /> {errors.auth}</p>}
              </div>

              <div className="h-px bg-white/5 mx-4 my-2"></div>

              <div>
                <IceInput label="Nouveau mot de passe" type="password" value={passData.newPassword} onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })} placeholder="Min 6 car. (lettre+chiffre)" required autoComplete="new-password" />
                {errors.newPassword && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic"><AlertTriangle size={10} /> {errors.newPassword}</p>}
              </div>

              <div>
                <IceInput label="Confirmer nouveau" type="password" value={passData.confirmPassword} onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })} required autoComplete="new-password" />
                {errors.confirmPassword && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 flex items-center gap-1 italic"><AlertTriangle size={10} /> {errors.confirmPassword}</p>}
              </div>
            </div>

            <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase text-[10px] transition-all italic tracking-widest mt-4 active:scale-95">
              Mettre à jour la sécurité
            </button>
          </form>

          {/* DANGER ZONE (Uniquement pour Admin) */}
          {!isEmployee && (
            <div className="lg:col-span-2 mt-12 pt-10 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
              <div className="glass-card p-8 rounded-[2.5rem] border-red-500/10 bg-red-500/[0.02] flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-left">
                  <h3 className="text-red-500 font-black uppercase italic tracking-tighter text-lg leading-tight">Zone de Danger</h3>
                  <p className="text-white/30 text-[10px] font-bold uppercase mt-1">Supprimer définitivement votre compte et toutes ses données (factures, produits...)</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        /* SECTION: EMPLOYÉES */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Gestion de l'équipe</h3>
              <p className="text-[10px] font-black uppercase text-white/20">Ajoutez des comptes pour vos vendeurs</p>
            </div>
            <button
              onClick={() => setShowAddEmployee(true)}
              className="bg-ice-400 text-ice-900 p-3 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-ice-400/20"
            >
              <UserPlus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp._id} className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02] flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-ice-400/10 text-ice-400 rounded-2xl group-hover:bg-ice-400 group-hover:text-ice-900 transition-all">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white">{emp.email}</p>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{emp.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployee(emp._id)}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="glass-card p-10 border-white/5 bg-white/[0.01] rounded-[2.5rem] text-center">
                <Users size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-xs font-black uppercase text-white/30 italic">Aucun employé pour le moment.</p>
                <p className="text-[9px] font-black uppercase text-white/10 mt-2">Créez des comptes pour vos vendeurs pour qu'ils puissent vous aider.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="max-w-2xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-card p-10 rounded-[3rem] border-white/5 shadow-2xl text-center space-y-8 bg-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-ice-400/10 blur-[100px] rounded-full" />

            <div className="relative">
              <div className="w-20 h-20 bg-ice-400/10 text-ice-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                <MessageSquare size={38} />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Besoin d'aide ?</h2>
              <p className="text-ice-100/50 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                Une question ou un problème technique ? <br />
                Contactez-nous directement pour une assistance rapide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <a
                href="tel:+221781901424"
                className="group p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-ice-400/30 hover:bg-ice-400/5 transition-all duration-500 flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-ice-400/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <Phone size={24} className="text-ice-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Par Téléphone</p>
                  <p className="text-sm font-black text-white tracking-tighter">+221 78 190 14 24</p>
                </div>
              </a>

              <a
                href="mailto:kassadiallo603@gmail.com"
                className="group p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-ice-400/30 hover:bg-ice-400/5 transition-all duration-500 flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-ice-400/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <Mail size={24} className="text-ice-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Par Email</p>
                  <p className="text-[9px] font-black text-white truncate max-w-[140px]">kassadiallo603@gmail.com</p>
                </div>
              </a>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[9px] font-black uppercase text-white/20 tracking-widest italic">Disponible 7j/7 • Réponse Rapide</p>
            </div>
          </div>
        </div>
      )}


      {/* MODAL DE CONFIRMATION AVEC MOT DE PASSE */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-[#09090b]/80">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase italic tracking-tighter text-white">Confirmer l'Action</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 mb-6">Saisissez votre mot de passe pour valider les changements</p>

              <form onSubmit={handleFinalSave} className="w-full space-y-4">
                <IceInput
                  label="Vôtre mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoFocus
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 rounded-xl border border-white/5 text-white/30 font-black uppercase text-[10px] hover:bg-white/5 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-2 px-8 py-4 rounded-xl bg-orange-500 text-black font-black uppercase text-[10px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    Valider
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div >
      )
      }

      {/* MODAL SUPPRESSION DE COMPTE */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="glass-card w-full max-w-md p-8 rounded-[3rem] border border-red-500/20 shadow-2xl bg-[#09090b]/90">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black italic uppercase text-red-500 tracking-tighter">Supprimer le Compte ?</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 mb-6 leading-relaxed">
                  Cette action est irréversible. <br />
                  Toutes vos factures et produits seront perdus.
                </p>

                <form onSubmit={handleDeleteAccount} className="w-full space-y-4">
                  <IceInput
                    label="Vôtre mot de passe"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                      Confirmer la suppression définitive
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword('');
                      }}
                      className="w-full py-4 rounded-xl border border-white/5 text-white/30 font-black uppercase text-[10px] hover:bg-white/5 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* MODAL ADD EMPLOYEE */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="glass-card w-full max-w-sm p-8 rounded-[3rem] border-white/10 relative bg-[#09090b]">
            <button onClick={() => setShowAddEmployee(false)} className="absolute top-6 right-6 text-white/20"><X size={20} /></button>
            <div className="text-center mb-8">
              <div className="p-4 bg-ice-400/10 text-ice-400 rounded-2xl inline-block mb-4"><UserPlus size={32} /></div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Nouveau Vendeur</h3>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <IceInput
                label="Email (Gmail)"
                type="email"
                placeholder="vendeur@gmail.com"
                value={employeeData.email}
                onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                required
              />
              <PhoneInput
                label="Téléphone"
                value={employeeData.phone}
                onChange={(val) => setEmployeeData({ ...employeeData, phone: val })}
              />
              <IceInput
                label="Mot de passe"
                type="password"
                value={employeeData.password}
                onChange={(e) => setEmployeeData({ ...employeeData, password: e.target.value })}
                required
              />
              <button type="submit" className="w-full py-4 bg-ice-400 text-ice-900 rounded-2xl font-black uppercase text-[10px] mt-4 shadow-lg active:scale-95 transition-all">
                Créer le compte
              </button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CONFIRMATION SUPPRESSION EMPLOYÉ */}
      {showDeleteEmployeeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl bg-[#09090b]/90">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase text-red-500 tracking-tighter">Supprimer ce vendeur ?</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 mb-6 leading-relaxed">
                Cet employé ne pourra plus accéder à la caisse.
              </p>

              <div className="flex flex-col gap-3 pt-2 w-full">
                <form onSubmit={confirmEmployeeDeletion} className="w-full space-y-3">
                  <IceInput
                    label="Mot de passe gérant"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[10px] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                  >
                    Confirmer la suppression
                  </button>
                </form>
                <button
                  onClick={() => {
                    setShowDeleteEmployeeModal(false);
                    setEmployeeToDelete(null);
                  }}
                  className="w-full py-4 rounded-xl border border-white/5 text-white/30 font-black uppercase text-[10px] hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}