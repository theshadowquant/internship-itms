import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("shimmer rounded-lg w-full h-4", className)}
      {...props}
    />
  );
};

export default Skeleton;
