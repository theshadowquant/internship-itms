import React, { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export function SplineScene({ scene, className }) {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-slate-950/20 rounded-xl">
        {/* Sleek micro-animation spinner */}
        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-brand animate-spin" />
      </div>
    }>
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
