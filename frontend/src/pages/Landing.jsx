import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Shield, Store, ChevronRight, Download, Zap, Lock, TrendingUp } from 'lucide-react';
import showcase1 from '../assets/showcase1.png';
import showcase2 from '../assets/showcase2.png';
import showcase3 from '../assets/showcase3.png';
import showcase4 from '../assets/showcase4.png';
import showcase5 from '../assets/showcase5.png';
import showcase6 from '../assets/showcase6.png';
import showcase7 from '../assets/showcase7.png';
import showcase8 from '../assets/showcase8.png';

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
        <div className="min-h-screen bg-[#05070a] text-white flex flex-col font-sans overflow-x-hidden relative">
            {/* BACKGROUND GLOW */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-ice-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* HERO SECTION */}
            <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-10 px-6 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-1 h-8 bg-ice-400 rounded-full shadow-[0_0_15px_rgba(0,242,255,0.6)]" />
                        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
                            Ice <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-400 to-blue-600">Facture</span>
                        </h1>
                    </div>
                    <p className="text-white/40 text-sm md:text-lg font-bold uppercase tracking-widest max-w-xl mx-auto mb-12">
                        La gestion de boutique simplifiée pour les entrepreneurs visionnaires.
                    </p>
                </motion.div>

                {/* SCREENSHOTS CAROUSEL (Simple Grid for now) */}
                <div className="relative w-full max-w-6xl mx-auto mb-16 overflow-hidden mask-linear-fade">
                    <motion.div
                        className="flex gap-6 w-max"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            duration: 40,
                            ease: "linear",
                            repeat: Infinity
                        }}
                    >
                        {[showcase1, showcase2, showcase3, showcase4, showcase5, showcase6, showcase7, showcase8, showcase1, showcase2, showcase3, showcase4, showcase5, showcase6, showcase7, showcase8].map((img, idx) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[320px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent opacity-30 group-hover:opacity-0 transition-opacity" />
                                <img src={img} alt={`App Screen ${idx}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
                            </div>
                        ))}
                    </motion.div>
                </div>

                <style>{`
                    .mask-linear-fade {
                        mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    }
                `}</style>

                {/* INSTALL APP BUTTON (Mobile/PWA) */}
                {deferredPrompt && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallClick}
                        className="mb-12 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all animate-bounce"
                    >
                        <Download size={16} /> Installer l'Application
                    </motion.button>
                )}

                {/* IOS INSTALL HINT (Visible only on iOS) */}
                {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone && (
                    <div className="mb-12 mx-6 p-4 glass-card rounded-2xl border border-white/10 text-center animate-pulse">
                        <p className="text-[10px] font-bold text-white/60 uppercase mb-2">Pour installer sur iPhone :</p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-ice-400">
                            <span>Appuyez sur</span>
                            <span className="p-1 bg-white/10 rounded">Partager ⎋</span>
                            <span>puis</span>
                            <span className="p-1 bg-white/10 rounded">Sur l'écran d'accueil ⊞</span>
                        </div>
                    </div>
                )}

                {/* FEATURES GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16 w-full">
                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto text-blue-400">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2">Ultra Rapide</h3>
                        <p className="text-[10px] text-white/40">Encaissez en 3 clics. Zéro latence, même hors-connexion.</p>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto text-green-400">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2">Sécurisé</h3>
                        <p className="text-[10px] text-white/40">Vos données sont cryptées et sauvegardées automatiquement.</p>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto text-purple-400">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-2">Croissance</h3>
                        <p className="text-[10px] text-white/40">Analysez vos ventes et maximisez vos profits.</p>
                    </div>
                </div>

                {/* PRIVACY & ACTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
                >
                    <div className="flex items-start gap-4 mb-6">
                        <Shield className="text-ice-400 mt-1 flex-shrink-0" size={24} />
                        <div className="text-left">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Confidentialité & Sécurité</h3>
                            <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                Vos données sont cryptées et sécurisées. Nous respectons votre vie privée et ne partageons aucune information avec des tiers sans votre consentement explicite. En continuant, vous acceptez nos conditions d'utilisation conformes aux normes internationales.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => setAccepted(!accepted)}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${accepted ? 'bg-ice-400 border-ice-400 text-black' : 'border-white/20 bg-black/20 group-hover:border-white/40'}`}>
                            {accepted && <Check size={14} strokeWidth={4} />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/70 select-none">
                            J'accepte les conditions d'utilisation
                        </span>
                    </div>

                    <button
                        onClick={() => accepted && navigate('/register')}
                        disabled={!accepted}
                        className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${accepted ? 'bg-ice-400 text-ice-900 shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        <Store size={16} /> Créer ma boutique
                    </button>

                    <div className="mt-4 text-center">
                        <button onClick={() => navigate('/login')} className="text-[9px] font-black uppercase text-white/30 hover:text-white transition-colors">
                            J'ai déjà un compte
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* FOOTER */}
            <div className="py-6 text-center text-[9px] font-black uppercase text-white/10 tracking-[0.3em]">
                © {new Date().getFullYear()} Ice Facture • Secure POS
            </div>
        </div>
    );
}
