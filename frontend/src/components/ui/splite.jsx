import React, { Suspense, lazy, Component, useState, useEffect } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Error boundary to catch Spline crashes silently
class SplineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/20 rounded-xl gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-brand opacity-40" />
          <p className="text-[10px] text-slate-600">3D scene unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Timeout fallback — if Spline takes > 12s, show placeholder
function SplineWithTimeout({ scene, className }) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/20 rounded-xl gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-brand opacity-40" />
        <p className="text-[10px] text-slate-600">3D engine loading slowly...</p>
      </div>
    );
  }

  return <Spline scene={scene} className={className} />;
}

export function SplineScene({ scene, className }) {
  return (
    <SplineErrorBoundary>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-slate-950/20 rounded-xl">
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-brand animate-spin" />
        </div>
      }>
        <SplineWithTimeout scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
}

