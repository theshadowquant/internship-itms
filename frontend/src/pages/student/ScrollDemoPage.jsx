import React from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { HeroScrollDemo } from '../../components/ui/container-scroll-demo';

const ScrollDemoPage = () => {
  return (
    <PageWrapper>
      {/* Decorative header */}
      <div className="flex flex-col mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Aceternity Scroll Reveal Showcase
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scroll down below to see the interactive 3D rotation, scaling, and tilt effect of the card.
        </p>
      </div>

      {/* Main scrolling viewport */}
      <div className="w-full glass rounded-[24px] border border-slate-200 dark:border-slate-800 bg-slate-950/5 overflow-hidden p-4 md:p-8">
        <HeroScrollDemo />
      </div>
    </PageWrapper>
  );
};

export default ScrollDemoPage;
