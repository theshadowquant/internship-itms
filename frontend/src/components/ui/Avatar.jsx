import React from 'react';
import { cn } from '../../utils/cn';

const Avatar = ({
  src,
  firstName = '',
  lastName = '',
  size = 'md',
  className,
}) => {
  const getInitials = () => {
    const fChar = firstName ? firstName.trim().charAt(0) : '';
    const lChar = lastName ? lastName.trim().charAt(0) : '';
    return (fChar + lChar).toUpperCase() || '?';
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-lg font-bold',
    xl: 'h-20 w-20 text-2xl font-bold',
  };

  // Prepend backend static address for local uploads if src is relative
  const getAvatarUrl = () => {
    if (!src) return null;
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const serverURL = baseURL.replace('/api/v1', ''); // Strip endpoint path to match root static serving
    return `${serverURL}${src}`;
  };

  const finalSrc = getAvatarUrl();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-brand-light text-brand overflow-hidden shrink-0 border border-slate-700/50 dark:bg-brand/10 dark:text-brand",
        sizes[size],
        className
      )}
    >
      {finalSrc ? (
        <img
          src={finalSrc}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'; // Fallback to initials if image fails to load
          }}
        />
      ) : (
        <span>{getInitials()}</span>
      )}
    </div>
  );
};

export default Avatar;
