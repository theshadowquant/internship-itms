import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'info', className }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border';

  const variants = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  };

  // Automated Status Mapper
  const text = String(children).toUpperCase();
  let selectedVariant = variant;

  if (['HIRED', 'APPROVED', 'ACTIVE', 'IMMEDIATE'].includes(text)) {
    selectedVariant = 'success';
  } else if (['SHORTLISTED', 'INTERVIEW', 'OFFER_SENT', 'ONE_MONTH', 'PENDING'].includes(text)) {
    selectedVariant = 'warning';
  } else if (['REJECTED', 'CLOSED', 'NOT_AVAILABLE'].includes(text)) {
    selectedVariant = 'danger';
  } else if (['APPLIED', 'THREE_MONTHS'].includes(text)) {
    selectedVariant = 'info';
  } else if (['ADMIN'].includes(text)) {
    selectedVariant = 'purple';
  } else if (['WITHDRAWN', 'PAUSED', 'STUDENT'].includes(text)) {
    selectedVariant = 'slate';
  }

  return (
    <span className={cn(baseStyles, variants[selectedVariant], className)}>
      {children}
    </span>
  );
};

export default Badge;
