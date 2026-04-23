import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export const StatsCard = ({ label, value, trend, trendType = 'neutral', subtext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
    >
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className={cn(
          "text-3xl font-headline font-extrabold",
          trendType === 'danger' ? "text-primary" : "text-brand-purple"
        )}>
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-xs font-extrabold mb-1.5",
            trendType === 'success' ? "text-secondary" : 
            trendType === 'danger' ? "text-primary" : "text-slate-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtext}</p>}
    </motion.div>
  );
};
