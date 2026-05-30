import * as React from "react";
import { cn } from "../../utils/cn";

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-slate-800 bg-slate-900 text-slate-100 shadow-glass",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";
