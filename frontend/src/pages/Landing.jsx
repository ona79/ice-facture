import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Shield, Store, ChevronRight, Download, Zap, Lock, TrendingUp } from 'lucide-react';
import promo1 from '../assets/promo1.jpg';
import promo2 from '../assets/promo2.jpg';
import showcase3 from '../assets/showcase3.png';
import showcase4 from '../assets/showcase4.png';
import showcase5 from '../assets/showcase5.png';
import showcase6 from '../assets/showcase6.png';
import showcase7 from '../assets/showcase7.png';
import showcase8 from '../assets/showcase8.png';
import { CardBeam } from '../components/CardBeam';

export default function Landing() {
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-x-hidden relative">
            {/* BACKGROUND GLOW */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-ice-400/10 rounded-full blur-[120px] pointer-events-none" />

            {/* HERO SECTION */}
            <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-10 px-6 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-1 h-8 bg-ice-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 drop-shadow-sm">
                            Ice <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-400 to-blue-600">Facture</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm md:text-lg font-bold uppercase tracking-widest max-w-xl mx-auto mb-12">
                        La gestion de boutique simplifiée pour les entrepreneurs visionnaires.
                    </p>
                </motion.div>

                {/* STATIC SHOWCASE */}
                <div className="w-full max-w-5xl mx-auto mb-16 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-left space-y-6"
                        >
                            <h2 className="text-2xl md:text-3xl font-black uppercase italic text-ice-600">
                                La clarté au service de votre business
                            </h2>
                            <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-medium">
                                Visualisez vos performances en un clin d'œil. Notre interface épurée vous permet de vous concentrer sur ce qui compte vraiment : la satisfaction de vos clients et la croissance de votre entreprise.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { title: "Dashboard Interactif", desc: "Suivez vos ventes journalières et mensuelles." },
                                    { title: "Point de Vente Optimisé", desc: "Une interface tactile pour des encaissements rapides." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-ice-400 shadow-[0_0_10px_rgba(56,189,248,0.3)] flex-shrink-0" />
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">{item.title}</h4>
                                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="relative flex gap-4 md:gap-6 items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 30, rotate: -2 }}
                                whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                viewport={{ once: true }}
                                className="w-1/2"
                            >
                                <CardBeam className="w-full shadow-xl shadow-blue-900/5 ring-1 ring-slate-200">
                                    <img src={promo1} alt="Interface Facturation" className="w-full h-auto object-cover" />
                                </CardBeam>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 50, rotate: 2 }}
                                whileInView={{ opacity: 1, y: 0, rotate: 2 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                viewport={{ once: true }}
                                className="w-1/2 mt-12"
                            >
                                <CardBeam className="w-full shadow-xl shadow-blue-900/5 ring-1 ring-slate-200">
                                    <img src={promo2} alt="Gestion de Stock" className="w-full h-auto object-cover" />
                                </CardBeam>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* INSTALL APP BUTTON (Mobile/PWA) */}
                {deferredPrompt && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallClick}
                        className="mb-12 px-6 py-3 bg-white shadow-lg border border-slate-100 rounded-full text-slate-900 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all animate-bounce"
                    >
                        <Download size={16} className="text-ice-600" /> Installer l'Application
                    </motion.button>
                )}

                {/* IOS INSTALL HINT (Visible only on iOS) */}
                {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone && (
                    <div className="mb-12 mx-6 p-4 glass-card rounded-2xl border border-blue-100 text-center animate-pulse">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pour installer sur iPhone :</p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-ice-600">
                            <span>Appuyez sur</span>
                            <span className="p-1 bg-slate-100 rounded">Partager ⎋</span>
                            <span>puis</span>
                            <span className="p-1 bg-slate-100 rounded">Sur l'écran d'accueil ⊞</span>
                        </div>
                    </div>
                )}

                {/* FEATURES GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16 w-full px-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-slate-800">Ultra Rapide</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">Encaissez en 3 clics. Zéro latence, même hors-connexion.</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-slate-800">Sécurisé</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">Vos données sont cryptées et sauvegardées automatiquement.</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4 mx-auto shadow-inner">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-slate-800">Croissance</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase italic">Analysez vos ventes et maximisez vos profits.</p>
                    </div>
                </div>

                {/* PRIVACY & ACTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-md bg-white shadow-2xl shadow-blue-900/10 border border-slate-100 rounded-3xl p-6 md:p-8 mb-10"
                >
                    <div className="flex items-start gap-4 mb-6">
                        <Shield className="text-ice-600 mt-1 flex-shrink-0" size={24} />
                        <div className="text-left">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Confidentialité & Sécurité</h3>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                Vos données sont cryptées et sécurisées. Nous respectons votre vie privée et ne partageons aucune information avec des tiers sans votre consentement explicite. En continuant, vous acceptez nos conditions d'utilisation conformes aux normes internationales.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => setAccepted(!accepted)}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${accepted ? 'bg-ice-600 border-ice-600 text-white' : 'border-slate-300 bg-slate-50 group-hover:border-ice-400'}`}>
                            {accepted && <Check size={14} strokeWidth={4} />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 select-none">
                            J'accepte les conditions d'utilisation
                        </span>
                    </div>

                    <button
                        onClick={() => accepted && navigate('/register')}
                        disabled={!accepted}
                        className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${accepted ? 'bg-ice-600 text-white shadow-[0_10px_25px_rgba(2,132,199,0.3)] hover:scale-[1.02] active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Store size={16} /> Créer ma boutique
                    </button>

                    <div className="mt-4 text-center">
                        <button onClick={() => navigate('/login')} className="text-[9px] font-black uppercase text-slate-400 hover:text-ice-600 transition-colors">
                            J'ai déjà un compte
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* FOOTER */}
            <div className="py-6 text-center text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">
                © {new Date().getFullYear()} Ice Facture • Secure POS
            </div>
        </div>
    );
}
