import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  className,
  name,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider uppercase" htmlFor={name}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        className={cn(
          "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm",
          "dark:bg-slate-900 dark:border-slate-800 focus:ring-offset-0",
          error && "border-red-500 focus:ring-red-500/30 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-red-500 transition-all animate-fade-slide-up">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
