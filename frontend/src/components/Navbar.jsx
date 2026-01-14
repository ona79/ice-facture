import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
    const location = useLocation();
    const hideOnPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

    if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const navItems = [
        { name: 'Accueil', path: '/dashboard' },
        { name: 'Boutique', path: '/new-invoice' },
        { name: 'Stock', path: '/products' },
        { name: 'Factures', path: '/history' },
    ];

    const [isOpen, setIsOpen] = React.useState(false);

    // Fermer le menu après un clic (mobile)
    const handleLinkClick = () => setIsOpen(false);

    return (
        <>
            {/* BOUTON MOBILE (HAMBURGER) */}
            <div className="fixed top-4 left-4 z-[100] md:hidden">
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

            {/* NAV BAR DESKTOP & MOBILE MENU */}
            <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${isOpen ? 'translate-y-0 bg-[#09090b]/95 h-screen pt-20 items-start' : '-translate-y-full md:translate-y-0 md:top-4 md:h-auto md:bg-transparent md:pointer-events-none'}`}>

                <div className={`flex flex-col md:flex-row bg-[#1a1f26]/90 backdrop-blur-md md:rounded-full p-2 border-b md:border border-white/10 pointer-events-auto w-full md:w-auto overflow-hidden transition-all gap-2 md:gap-0 ${isOpen ? 'items-center' : ''}`}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                                `relative px-6 py-4 md:py-2 text-sm font-bold transition-all duration-300 md:rounded-full whitespace-nowrap w-full md:w-auto text-center ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-white/10 md:rounded-full rounded-xl"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 text-lg md:text-sm uppercase tracking-widest">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </>
    );
};

export default Navbar;
