import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileCheck, 
  CalendarDays, 
  TrendingUp, 
  Award, 
  Clock, 
  Building2, 
  MapPin, 
  Briefcase 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getStudentAnalytics } from '../../api/analytics';
import { getMyApplications } from '../../api/applications';
import StatCard from '../../components/shared/StatCard';
import EmptyState from '../../components/shared/EmptyState';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { cn } from '../../utils/cn';
import { SplineSceneBasic } from '../../components/ui/demo';

const Dashboard = () => {
  const navigate = useNavigate();
  // 1. Fetch Student Analytics
  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['studentAnalytics'],
    queryFn: getStudentAnalytics,
  });

  // 2. Fetch Student Applications to locate active Hired placement
  const { data: appsRes, isLoading: isAppsLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: getMyApplications,
  });

  const stats = statsRes?.data;
  const applications = appsRes?.data || [];
  const hiredApp = applications.find(app => app.status === 'HIRED');

  const isLoading = isStatsLoading || isAppsLoading;

  // Active Placement Calculations
  const getActiveInternshipMetrics = () => {
    if (!hiredApp || !hiredApp.internship) return null;
    const { startDate, durationWeeks } = hiredApp.internship;
    const start = new Date(startDate);
    const end = new Date(start.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = Date.now() - start.getTime();
    
    const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const elapsedWeeks = Math.max(0, Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)));

    // Attendance index logic (logs/5 days a week)
    const logsCount = stats?.tasksCompleted || 0;
    const expectedLogs = Math.max(1, elapsedWeeks * 5);
    const attendanceRate = Math.min(100, Math.max(30, Math.round((logsCount / expectedLogs) * 100)));

    return {
      percentElapsed,
      attendanceRate,
      remainingWeeks: Math.max(0, durationWeeks - elapsedWeeks),
    };
  };

  const activeMetrics = getActiveInternshipMetrics();

  // Animation states
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Immersive 3D Spline Scene Hero Banner */}
      <motion.div variants={itemVariants}>
        <SplineSceneBasic />
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications || 0}
          icon={Briefcase}
          isLoading={isLoading}
          color="blue"
        />
        <StatCard
          title="Shortlisted Count"
          value={stats?.byStatus?.SHORTLISTED || 0}
          icon={FileCheck}
          isLoading={isLoading}
          color="amber"
        />
        <StatCard
          title="Daily Shift Logs"
          value={stats?.tasksCompleted || 0}
          icon={CalendarDays}
          isLoading={isLoading}
          color="green"
        />
        <StatCard
          title="Performance Index"
          value={`${stats?.performanceScore || 0}%`}
          icon={Award}
          isLoading={isLoading}
          color="purple"
        />
      </motion.div>

      {/* Dynamic Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Side: Charts & Placement */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Active Internship Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <CalendarDays className="h-4.5 w-4.5 text-brand" />
              <span>Active Placement Milestone</span>
            </h3>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : !hiredApp ? (
              <EmptyState
                title="No Active Internship"
                description="You currently do not have any HIRED placements linked. Explore search channels and submit applications to trigger metrics trackings."
                actionText="Explore Internships"
                onAction={() => navigate('/explore')}
              />
            ) : (
              <div className="space-y-6 select-none">
                {/* Company details banner */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-brand/10 text-brand rounded-xl border border-brand/20">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{hiredApp.internship.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{hiredApp.internship.companyName}</span>
                        <span className="text-slate-700">•</span>
                        <MapPin className="h-3 w-3" />
                        <span>{hiredApp.internship.location}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" className="w-fit">PLACEMENT COMMENCED</Badge>
                </div>

                {/* Progress details row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-slate-950/20 rounded-xl border border-slate-800/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Duration Progress</span>
                    <span className="text-lg font-extrabold text-brand">{activeMetrics?.percentElapsed}%</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{activeMetrics?.remainingWeeks} weeks remaining</span>
                  </div>
                  <div className="p-4 bg-slate-950/20 rounded-xl border border-slate-800/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Attendance Index</span>
                    <span className="text-lg font-extrabold text-emerald-400">{activeMetrics?.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Approved vs Expected Logs</span>
                  </div>
                  <div className="p-4 bg-slate-950/20 rounded-xl border border-slate-800/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Commencement Date</span>
                    <span className="text-sm font-extrabold text-slate-200 mt-1 block leading-tight">
                      {formatDate(hiredApp.internship.startDate)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">{hiredApp.internship.durationWeeks} Weeks Term</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-semibold">
                    <span>Milestone progress</span>
                    <span>{activeMetrics?.percentElapsed}% complete</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeMetrics?.percentElapsed}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-brand rounded-full shadow-premium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recharts BarChart Hours Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <Clock className="h-4.5 w-4.5 text-brand" />
              <span>Weekly Work Log (Shift Hours)</span>
            </h3>

            {isLoading ? (
              <Skeleton className="h-64" />
            ) : !stats?.weeklyHours || stats.weeklyHours.length === 0 ? (
              <EmptyState title="No hourly logs" description="No approved hours recorded in the past week." />
            ) : (
              <div className="h-64 w-full select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyHours} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a6cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1254c6" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(30, 41, 59, 0.2)' }}
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Application Pipeline & Mini Lists */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Applications Pipeline chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <TrendingUp className="h-4.5 w-4.5 text-brand" />
              <span>Applications Pipeline</span>
            </h3>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : !stats?.byStatus ? (
              <EmptyState title="No pipeline active" description="Submit applications to render pipelines." />
            ) : (
              <div className="space-y-4 select-none">
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const maxCount = Math.max(1, ...Object.values(stats.byStatus));
                  const percentWidth = Math.round((count / maxCount) * 100);

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400 uppercase tracking-wider">{status.replace('_', ' ')}</span>
                        <span className="text-slate-200">{count}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${percentWidth}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            status === 'HIRED' && 'bg-emerald-500',
                            ['SHORTLISTED', 'OFFER_SENT'].includes(status) && 'bg-amber-500',
                            status === 'REJECTED' && 'bg-rose-500',
                            status === 'APPLIED' && 'bg-brand'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Tasks summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-4 flex items-center space-x-2">
              <Award className="h-4.5 w-4.5 text-brand" />
              <span>Recent Tasks logs</span>
            </h3>
            {isLoading ? (
              <Skeleton className="h-24" />
            ) : applications.length === 0 ? (
              <EmptyState title="No placements" description="Hired placements unlock work log channels." />
            ) : (
              <div className="space-y-3.5 select-none">
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 leading-snug">Completed logs</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      Shift logs checked-in and approved: {stats?.tasksCompleted || 0} logs
                    </p>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 leading-snug">Active applications</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      Internships in shortlists/interview processes: {applications.filter(a => ['SHORTLISTED', 'INTERVIEW', 'OFFER_SENT'].includes(a.status)).length} postings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
