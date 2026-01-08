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

    return (
        <nav className="fixed top-2 left-2 right-2 z-50 flex justify-center pointer-events-none">
            <div className="flex bg-[#1a1f26]/80 backdrop-blur-md rounded-full p-1 border border-white/10 pointer-events-auto max-w-full overflow-x-auto scrollbar-hide">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative px-3 sm:px-6 py-2 text-xs sm:text-sm font-bold transition-all duration-300 rounded-full whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
