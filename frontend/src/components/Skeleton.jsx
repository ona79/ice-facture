import { motion } from 'framer-motion';

export const Skeleton = ({ className, width, height, rounded = "1rem" }) => {
    return (
        <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={`bg-white/5 border border-white/5 shadow-inner ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: rounded
            }}
        />
    );
};

export const CardSkeleton = () => (
    <div className="glass-card p-5 rounded-3xl border-white/5 bg-white/[0.02] flex justify-between items-center w-full">
        <div className="flex items-center gap-4 w-full">
            <Skeleton width="40px" height="40px" rounded="1rem" />
            <div className="flex flex-col gap-2 flex-1">
                <Skeleton width="60%" height="12px" />
                <Skeleton width="40%" height="8px" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <Skeleton width="50px" height="15px" />
            <Skeleton width="30px" height="30px" rounded="0.8rem" />
        </div>
    </div>
);

export const ProductSkeleton = () => (
    <div className="p-3 lg:p-5 rounded-[1.2rem] lg:rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between items-start lg:min-h-[120px]">
        <div className="flex justify-between w-full mb-2 lg:mb-3">
            <Skeleton width="32px" height="32px" rounded="0.8rem" />
            <Skeleton width="60px" height="15px" rounded="0.5rem" />
        </div>
        <Skeleton width="80%" height="14px" className="mb-2" />
        <Skeleton width="40%" height="10px" />
    </div>
);
