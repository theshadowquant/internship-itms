import React from 'react';
import { SplineScene } from "./splite";
import { Card } from "./card";
import { Spotlight } from "./spotlight";

export function SplineSceneBasic() {
  return (
    <Card className="w-full h-auto md:h-[350px] bg-slate-900/65 border-slate-800/80 relative overflow-hidden select-none shadow-glass backdrop-blur-md">
      {/* Dynamic Aceternity Spotlight rays */}
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Core Description Column */}
        <div className="flex-1 p-6 md:p-8 relative z-10 flex flex-col justify-center text-left">
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 text-[9px] font-bold tracking-widest text-brand uppercase bg-brand/10 rounded-full border border-brand/20 dark:text-brand dark:bg-brand/5 dark:border-brand/15 mb-3 w-fit">
            AI Placement Diagnostics
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-slate-50 to-slate-450 tracking-wide leading-tight">
            Immersive 3D Matching Engine
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-400 max-w-md leading-relaxed">
            Rotate and interact with our high-fidelity workspace. Monitor real-time student placement compatibility scoring, weekly hour telemetry, and automated performance index models in three dimensions.
          </p>
        </div>

        {/* Dynamic 3D Spline Viewport */}
        <div className="flex-1 relative w-full h-[250px] md:h-full overflow-hidden min-h-[250px]">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" 
            className="w-full h-full absolute inset-0"
          />
        </div>
      </div>
    </Card>
  );
}
