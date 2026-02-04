import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Home, ShoppingBag, Box, FileText, Menu, X } from 'lucide-react';

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
    const { isOnline, offlineQueue } = useOfflineSync();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const hideOnPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

    React.useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (location.pathname === '/' || hideOnPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const shopName = localStorage.getItem('shopName') || "MA BOUTIQUE";

    const navItems = [
        { name: 'ACCUEIL', path: '/dashboard', icon: Home },
        { name: 'BOUTIQUE', path: '/new-invoice', icon: ShoppingBag },
        { name: 'ACTION', path: '/products', icon: Box },
        { name: 'FACTURES', path: '/history', icon: FileText },
    ];

    const handleLinkClick = () => setIsNavOpen(false);

    return (
        <>
            <AnimatePresence>
                {!isNavOpen && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{
                            y: scrolled ? -20 : 0,
                            opacity: scrolled ? 0 : 1,
                            pointerEvents: scrolled ? 'none' : 'auto'
                        }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="fixed top-4 left-6 md:left-10 z-[110] flex items-center gap-2 md:gap-3 whitespace-nowrap"
                    >
                        <Link to="/dashboard" className="flex items-center gap-2 md:gap-3 group pointer-events-auto">
                            <div className="w-1 h-5 md:h-6 bg-ice-600 rounded-full shadow-[0_0_15px_rgba(2,132,199,0.3)] group-hover:scale-y-125 transition-transform" />
                            <h2 className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-slate-900 drop-shadow-sm group-hover:text-ice-600 transition-colors">
                                {shopName}
                            </h2>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOUTON MENU MOBILE */}
            <div className="fixed top-4 right-4 z-[110] md:hidden flex items-center gap-3">
                <button
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    className="p-3 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl text-slate-900 shadow-xl active:scale-95 transition-all"
                >
                    {isNavOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {isNavOpen && (
                    <>
                        {/* OVERLAY RENDERER */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNavOpen(false)}
                            className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm md:hidden"
                        />

                        {/* DRAWER RENDERER */}
                        <motion.nav
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 bottom-0 left-0 z-[130] w-[80%] max-w-[300px] bg-white border-r border-slate-50 flex flex-col p-8 rounded-tr-[3.5rem] rounded-br-[3.5rem] shadow-2xl md:hidden"
                        >
                            {/* SHOP NAME HEADER */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 mb-14 mt-4 px-2"
                            >
                                <div className="w-1.5 h-8 bg-ice-600 rounded-full shadow-[0_0_20px_rgba(2,132,199,0.3)]" />
                                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 drop-shadow-sm">
                                    {shopName}
                                </h2>
                            </motion.div>

                            {/* NAV ITEMS WITH STAGGER */}
                            <div className="flex flex-col gap-2 md:gap-4">
                                <LayoutGroup id="mobile-nav">
                                    {navItems.map((item, index) => (
                                        <motion.div
                                            key={item.path}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <NavLink
                                                to={item.path}
                                                onClick={handleLinkClick}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-5 px-6 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] relative group ${isActive ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="mobile-active-bg"
                                                                className="absolute inset-0 bg-ice-50 rounded-[1.5rem] md:rounded-[2rem] border border-ice-100 shadow-sm"
                                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                            />
                                                        )}
                                                        <item.icon size={22} className={`${isActive ? 'text-ice-600' : 'text-slate-100 group-hover:text-ice-600/40'} transition-colors relative z-10`} />
                                                        <span className="relative z-10">{item.name}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        </motion.div>
                                    ))}
                                </LayoutGroup>
                            </div>

                            {/* STATUS & FOOTER AT BOTTOM */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-auto pt-10"
                            >
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {isOnline ? 'Système En Ligne' : 'Mode Hors-ligne'}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Sync automatique</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* BARRE DE NAVIGATION DESKTOP */}
            <nav className="fixed top-4 left-0 right-0 z-50 hidden md:flex justify-center transition-all">
                <div className="flex bg-white/80 backdrop-blur-xl rounded-full p-1.5 border border-slate-100 gap-0 shadow-2xl items-center">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative px-8 py-2.5 text-xs font-black transition-all duration-500 rounded-full whitespace-nowrap text-center uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill-desktop"
                                            className="absolute inset-0 bg-slate-50 rounded-full"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="mx-4 h-4 w-px bg-slate-100" />

                    <div className="group relative pr-4">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'}`} />
                        <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 px-2 py-1 bg-white border border-slate-100 shadow-xl rounded text-[8px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-tighter">
                            {isOnline ? 'Connecté' : 'Synchronisation...'}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
