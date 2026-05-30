import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';

const StatCard = ({
  title,
  value,
  icon: Icon,
  delta,
  deltaType = 'increase',
  isLoading = false,
  color = 'blue',
  className,
}) => {
  const colors = {
    blue: 'border-l-4 border-l-blue-500 bg-slate-900/60 focus:border-blue-400',
    amber: 'border-l-4 border-l-amber-500 bg-slate-900/60 focus:border-amber-400',
    green: 'border-l-4 border-l-emerald-500 bg-slate-900/60 focus:border-emerald-400',
    purple: 'border-l-4 border-l-purple-500 bg-slate-900/60 focus:border-purple-400',
  };

  const textColors = {
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        "relative rounded-xl p-5 border border-slate-800 shadow-glass flex justify-between items-start select-none",
        colors[color],
        className
      )}
    >
      <div className="flex-1 space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{value}</span>
            {delta && (
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center space-x-0.5",
                  deltaType === 'increase' ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {deltaType === 'increase' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{delta}</span>
              </span>
            )}
          </div>
        )}
      </div>
      {Icon && (
        <div className={cn("p-2.5 rounded-lg", textColors[color])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
