import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Wifi, WifiOff } from 'lucide-react';

const Navbar = () => {
    const { isOnline, offlineQueue } = useOfflineSync();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false); // Moved UP
    const hideOnPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

    // Hide on Landing Page (root path) and auth pages
    if (location.pathname === '/' || hideOnPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const navItems = [
        { name: 'Accueil', path: '/dashboard' },
        { name: 'Boutique', path: '/new-invoice' },
        { name: 'Stock', path: '/products' },
        { name: 'Factures', path: '/history' },
    ];

    // Fermer le menu après un clic (mobile)
    const handleLinkClick = () => setIsOpen(false);

    return (
        <>
            {/* BOUTON MOBILE (HAMBURGER) */}
            <div className="fixed top-4 right-4 z-[100] md:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white shadow-xl active:scale-95 transition-all"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* NAV BAR DESKTOP & MOBILE MENU (SIDEBAR) */}
            <nav className={`fixed inset-y-0 left-0 z-50 flex flex-col items-start transition-transform duration-300 ease-out bg-[#09090b]/40 backdrop-blur-xl border-r border-white/5 w-64 pt-20 shadow-2xl md:fixed md:top-2 md:left-0 md:right-0 md:bottom-auto md:h-auto md:w-full md:border-none md:shadow-none md:flex-row md:justify-center md:items-start md:bg-transparent md:backdrop-blur-none md:pt-0 md:transform-none md:pointer-events-none ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

                <div className="flex flex-col md:flex-row md:bg-[#1a1f26]/80 md:backdrop-blur-xl md:rounded-full p-4 md:p-1.5 md:border md:border-white/10 w-full md:w-auto gap-2 md:gap-0 shadow-2xl pointer-events-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                                `relative px-6 py-3 md:py-2 text-sm font-bold transition-all duration-300 md:rounded-full whitespace-nowrap w-full md:w-auto text-left md:text-center rounded-xl ${isActive ? 'text-white bg-white/10 md:bg-transparent' : 'text-white/40 hover:text-white/70 hover:bg-white/5 md:hover:bg-transparent'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-white/10 md:bg-white/10 md:rounded-full rounded-xl hidden md:block" // Hidden on mobile, handled by className
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 text-sm uppercase tracking-widest">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
                <div className="hidden md:flex items-center ml-4 gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isOnline ? 'border-green-500/20 bg-green-500/10 text-green-500' : 'border-red-500/20 bg-red-500/10 text-red-500'} transition-all`}>
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                            {isOnline ? 'EN LIGNE' : 'HORS-LIGNE'}
                        </span>
                        {!isOnline && offlineQueue.length > 0 && (
                            <div className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full animate-bounce">
                                {offlineQueue.length}
                            </div>
                        )}
                    </div>
                    <ThemeToggle />
                </div>
            </nav>

            {/* OVERLAY BACKDROP (Mobile only) */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-lg md:hidden"
                />
            )}
        </>
    );
};

export default Navbar;
