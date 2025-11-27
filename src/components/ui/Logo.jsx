// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import flipDisplayLogo from '../../assets/FLIPDISPLAY LOGO.svg'

export default function Logo({ className = "w-8 h-8", animated = false }) {
    const logoElement = (
        <img
            src={flipDisplayLogo}
            alt="FlipDisplay Logo"
            className={`${className} flex-shrink-0 object-contain`}
        />
    );

    if (animated) {
        return (
            <motion.div
                className={`relative flex items-center justify-center ${className}`}
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {logoElement}
                <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                />
            </motion.div>
        );
    }

    return logoElement;
}
