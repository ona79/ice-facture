import { motion } from "framer-motion";

export const CardBeam = ({ children, className = "" }) => {
    return (
        <div className={`relative overflow-hidden rounded-3xl border border-white/10 group ${className}`}>
            {/* Content (Image) */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* Beam Animation Container */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                <motion.div
                    animate={{
                        x: ["-100%", "200%"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 w-1/2 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md"
                />

                {/* Sharp Beam Line */}
                <motion.div
                    animate={{
                        x: ["-100%", "200%"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 w-2 h-full -skew-x-12 bg-ice-400/50 blur-[2px] mix-blend-overlay"
                />
            </div>

            {/* Static Glow/Border Effects */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 group-hover:ring-ice-400/50 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};
