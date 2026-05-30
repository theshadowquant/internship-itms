import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, FileCheck, Award, TrendingUp, Building2, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { getAdminAnalytics } from '../../api/analytics';
import StatCard from '../../components/shared/StatCard';
import EmptyState from '../../components/shared/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const AdminDashboard = () => {
  // Fetch Admin Analytics
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: getAdminAnalytics,
  });

  const stats = analyticsRes?.data;

  // PieChart formatting helper
  const getPieData = () => {
    if (!stats?.statusBreakdown) return [];
    return Object.entries(stats.statusBreakdown)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  const pieData = getPieData();

  // Pie Chart Colors
  const COLORS = ['#1a6cf6', '#f59e0b', '#10b981', '#a855f7', '#64748b', '#ef4444', '#cbd5e1'];

  return (
    <div className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          isLoading={isLoading}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          isLoading={isLoading}
          color="amber"
        />
        <StatCard
          title="Active Openings"
          value={stats?.totalInternships || 0}
          icon={Briefcase}
          isLoading={isLoading}
          color="green"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalApplications || 0}
          icon={FileCheck}
          isLoading={isLoading}
          color="purple"
        />
        <StatCard
          title="Placement Index"
          value={`${stats?.placementRate || 0}%`}
          icon={Award}
          isLoading={isLoading}
          color="blue"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Line Chart: Monthly Applications Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
          <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
            <TrendingUp className="h-4.5 w-4.5 text-brand" />
            <span>Applications monthly frequency trend</span>
          </h3>

          {isLoading ? (
            <Skeleton className="h-64" />
          ) : !stats?.monthlyTrend || stats.monthlyTrend.length === 0 ? (
            <EmptyState title="No trend data" description="Applications logs are currently empty." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1a6cf6"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ stroke: '#1a6cf6', strokeWidth: 2, r: 4, fill: '#0f172a' }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart: Application Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
          <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
            <PieIcon className="h-4.5 w-4.5 text-brand" />
            <span>Applications Status Distribution</span>
          </h3>

          {isLoading ? (
            <Skeleton className="h-64" />
          ) : pieData.length === 0 ? (
            <EmptyState title="No status counts" description="No status data logged yet." />
          ) : (
            <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Labels Legend */}
              <div className="flex flex-col space-y-1.5 text-xs text-left max-h-56 overflow-y-auto pr-2">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px] w-24 truncate">{item.name}</span>
                    <span className="text-slate-200 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Companies Density Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium select-none text-left">
        <h3 className="text-base font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
          <Building2 className="h-4.5 w-4.5 text-brand" />
          <span>Top recruiters companies lists</span>
        </h3>

        {isLoading ? (
          <Skeleton className="h-28" />
        ) : !stats?.topCompanies || stats.topCompanies.length === 0 ? (
          <EmptyState title="No companies logged" description="Recruiters lists are currently empty." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stats.topCompanies.map((company, index) => (
              <div key={company.companyName} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rank #{index + 1}</span>
                  <span className="text-xs font-extrabold text-slate-200 block truncate max-w-[120px] mt-1">{company.companyName}</span>
                </div>
                <div className="px-2.5 py-1 rounded bg-brand/10 border border-brand/20 text-brand text-xs font-bold font-mono">
                  {company.count} apps
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
