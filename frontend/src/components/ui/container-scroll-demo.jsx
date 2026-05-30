import React from "react";
import { ContainerScroll } from "./container-scroll-animation";
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award, 
  MapPin, 
  ShieldCheck 
} from "lucide-react";

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-20 pt-10">
      <ContainerScroll
        titleComponent={
          <div className="mb-4 text-center select-none">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-[11px] font-bold tracking-widest text-brand uppercase bg-brand/10 rounded-full border border-brand/20 dark:text-brand dark:bg-brand/5 dark:border-brand/15">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ShadowQuant Dynamics Platform</span>
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-tight mt-4">
              Supercharge Your Placement Journey with <br />
              <span className="text-4xl md:text-[5rem] font-extrabold mt-3 leading-none bg-clip-text text-transparent bg-gradient-to-r from-brand via-indigo-500 to-purple-500 block">
                Next-Gen ITMS Pipeline
              </span>
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Scroll down to reveal your live internship pipeline dashboard—featuring deep skill-matching analytics, real-time shift verification metrics, and automated performance tracking.
            </p>
          </div>
        }
      >
        {/* Custom High-Fidelity Mock ITMS Internship Portal Dashboard */}
        <div className="w-full h-full bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col justify-between select-none font-sans overflow-y-auto">
          {/* Mock Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center shadow-lg shadow-brand/25">
                <span className="font-extrabold text-white text-sm font-serif">SQ</span>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-200">ShadowQuant Dynamics</h3>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">ITMS placement console</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Pipeline Diagnostics</span>
            </div>
          </div>

          {/* Core Analytics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Skill Overlap Score</span>
                <Award className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-2">
                <h4 className="text-xl font-extrabold tracking-tight text-white">98.4%</h4>
                <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">★★★★★ Exceptional Match</p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Shift Hours</span>
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2">
                <h4 className="text-xl font-extrabold tracking-tight text-white">124.5 Hrs</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">15 days continuous tracking</p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Interview Status</span>
                <Briefcase className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <h4 className="text-xl font-extrabold tracking-tight text-amber-400">GATED MATCH</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Round 3: Placement Review</p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Performance Index</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <h4 className="text-xl font-extrabold tracking-tight text-emerald-400">96.8%</h4>
                <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">▲ 2.4% vs last log check</p>
              </div>
            </div>
          </div>

          {/* Mock Pipeline Card */}
          <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Active Placement Diagnostics</h4>
                <p className="text-[9px] text-slate-500">Real-time telemetry stream</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-full uppercase tracking-wider">
                Commenced
              </span>
            </div>

            {/* Pipeline Steps Visual */}
            <div className="flex items-center justify-between space-x-2 my-2 py-3 bg-slate-900/80 rounded-lg px-4 border border-slate-800/40">
              <div className="flex flex-col items-center flex-1">
                <span className="h-6 w-6 rounded-full bg-brand/20 border border-brand text-brand flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-wider">Applied</span>
              </div>
              <div className="h-0.5 bg-slate-800 flex-1" />
              <div className="flex flex-col items-center flex-1">
                <span className="h-6 w-6 rounded-full bg-brand/20 border border-brand text-brand flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-wider">Shortlisted</span>
              </div>
              <div className="h-0.5 bg-slate-800 flex-1" />
              <div className="flex flex-col items-center flex-1">
                <span className="h-6 w-6 rounded-full bg-brand/20 border border-brand text-brand flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-wider">Interview</span>
              </div>
              <div className="h-0.5 bg-slate-850 flex-1" />
              <div className="flex flex-col items-center flex-1">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                <span className="text-[8px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">Hired</span>
              </div>
            </div>

            {/* Placement Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-900">
              <div className="flex items-start space-x-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                <div className="h-7 w-7 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-xs text-brand font-serif shrink-0">
                  RP
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Razorpay Software Engineer</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 flex items-center">
                    <MapPin className="h-3 w-3 mr-0.5 text-slate-500" />
                    Bangalore, Karnataka
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                <div className="h-7 w-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-200">Academic Verification Clean</h5>
                  <p className="text-[9px] text-emerald-400 mt-0.5">Approved by Placement Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
