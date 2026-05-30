import React from 'react';
import { Briefcase } from 'lucide-react';
import Button from '../ui/Button';

const EmptyState = ({
  title = "No data available",
  description = "There are no records to display at the moment.",
  actionText,
  onAction,
  icon: Icon = Briefcase,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 py-12 select-none animate-fade-slide-up">
      <div className="p-4 rounded-full bg-slate-800/40 border border-slate-800 text-slate-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-200 tracking-wide mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
