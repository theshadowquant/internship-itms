import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileCheck, 
  CalendarDays, 
  UserCircle, 
  LogOut, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  TrendingUp,
  MousePointerClick
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', path: '/explore', icon: Briefcase },
    { name: 'My Applications', path: '/applications', icon: FileCheck },
    { name: 'Daily Logs', path: '/daily-logs', icon: CalendarDays },
    { name: 'Scroll Demo', path: '/scroll-demo', icon: MousePointerClick },
    { name: 'My Profile', path: '/profile', icon: UserCircle },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: TrendingUp },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'Internships', path: '/admin/internships', icon: Briefcase },
    { name: 'Applications', path: '/admin/applications', icon: FileCheck },
    { name: 'Approve Logs', path: '/admin/daily-logs', icon: FileSpreadsheet },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <>
      {/* Desktop Sidebar Layout (>768px) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 shrink-0 fixed top-0 left-0 z-20">
        {/* Branding header */}
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800">
          <div className="h-9 w-9 rounded-lg bg-brand flex items-center justify-center shadow-premium shadow-brand/20">
            <span className="font-extrabold text-white text-base font-serif">SQ</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide">ShadowQuant</h1>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none block">ITMS Platform</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/60 hover:text-white select-none relative group",
                  isActive && "bg-slate-800 text-brand font-semibold hover:bg-slate-800 border-l-4 border-l-brand rounded-l-none"
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-4.5 w-4.5 group-hover:scale-105 transition-transform", isActive ? "text-brand" : "text-slate-400")} />
                    <span>{link.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute right-0 top-0 bottom-0 w-1 bg-brand rounded-l"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profiler Widget Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Avatar
                src={user?.avatarUrl}
                firstName={user?.firstName}
                lastName={user?.lastName}
                size="sm"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-200 truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </h4>
                <Badge className="text-[9px] px-1.5 py-0 mt-0.5 leading-none shrink-0 uppercase tracking-wide">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800/40 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg hover:bg-red-950/20 hover:border-red-900/30 hover:text-red-400 transition-all focus:outline-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Mobile Collapsed Bottom Nav (<768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-30 flex items-center justify-around px-2">
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center flex-1 py-1 text-slate-400 focus:outline-none select-none",
                isActive && "text-brand font-semibold"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[9px] tracking-wide font-medium">{link.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        {/* Mobile Profile Trigger link */}
        <NavLink
          to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/profile'}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 py-1 text-slate-400 focus:outline-none select-none",
            isActive && "text-brand font-semibold"
          )}
        >
          <UserCircle className="h-5 w-5 mb-0.5" />
          <span className="text-[9px] tracking-wide font-medium">Profile</span>
        </NavLink>
      </div>
    </>
  );
};

export default Sidebar;
