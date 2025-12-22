import React from 'react'
import { motion } from 'framer-motion'

export default function BrandingWatermark() {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="absolute bottom-8 left-8 flex items-center gap-3 pointer-events-none z-50"
        >
            <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center border border-teal-500/30">
                <div className="w-4 h-4 bg-teal-500 rounded-sm rotate-45" />
            </div>
            <div>
                <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Digital FlipBoard</p>
                <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Professional Signage OS</p>
            </div>
        </motion.div>
    )
}
