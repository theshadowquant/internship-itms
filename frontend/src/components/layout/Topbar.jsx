import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, LogOut, User, Settings, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../store/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../../api/users';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const Topbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [isThemeDark, setIsThemeDark] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Click-Away Refs
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Dynamic Title Logic
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview Dashboard';
    if (path === '/explore') return 'Explore Internships';
    if (path === '/applications') return 'My Applications';
    if (path === '/daily-logs') return 'Daily Progress Logs';
    if (path === '/profile') return 'Student Profile Details';
    if (path === '/admin/dashboard') return 'Administration Metrics';
    if (path === '/admin/users') return 'Account Management';
    if (path === '/admin/internships') return 'Manage Internships';
    if (path === '/admin/applications') return 'Applications Masterboard';
    if (path === '/admin/daily-logs') return 'Daily Logs Approvals';
    return 'ShadowQuant ITMS';
  };

  // Click-Away Listener Effect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme Toggler Effect
  useEffect(() => {
    if (isThemeDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isThemeDark]);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await getNotifications({ page: 1, limit: 5 });
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.pagination.unreadCount);
      }
    } catch (e) {
      console.warn('Failed to load notifications.');
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // refresh every 1m
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Search Debouncer Helper
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 right-0 z-10 w-full h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 select-none">
      {/* Title */}
      <h2 className="text-sm font-bold tracking-wide text-slate-100 uppercase md:text-base">
        {getPageTitle()}
      </h2>

      {/* Global Actions */}
      <div className="flex items-center space-x-4">
        {/* Search Input Bar (Hidden on mobile) */}
        <div className="hidden sm:relative sm:flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search internships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 md:w-64 pl-10 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>

        {/* Light/Dark Toggle */}
        <button
          onClick={() => setIsThemeDark(!isThemeDark)}
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
        >
          {isThemeDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 overflow-hidden text-slate-100"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/20">
                  <h4 className="text-xs font-bold text-slate-300">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-brand hover:text-brand-light flex items-center space-x-1 focus:outline-none"
                    >
                      <Check className="h-3 w-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500 font-medium">
                      No notifications available.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          if (notif.actionUrl) {
                            // Only navigate for internal relative paths
                            const url = notif.actionUrl.startsWith('/') ? notif.actionUrl : `/${notif.actionUrl}`;
                            navigate(url);
                          }
                        }}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors text-left",
                          !notif.isRead && "bg-brand/5 border-l-2 border-l-brand"
                        )}
                      >
                        <h5 className="text-xs font-bold text-slate-200 leading-snug">{notif.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">{notif.body}</p>
                        <span className="text-[9px] text-slate-600 block mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar Options Dropdown (STRICT BUGS RESOLUTION) */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="focus:outline-none rounded-full ring-1 ring-slate-800 hover:ring-brand/40 transition-all p-0.5"
          >
            <Avatar
              src={user?.avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="sm"
            />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 overflow-hidden text-slate-100"
              >
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/20 text-left">
                  <h4 className="text-xs font-bold text-slate-200 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </h4>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5 truncate">
                    {user?.email}
                  </span>
                </div>
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/profile');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 rounded-lg hover:bg-slate-800/80 hover:text-slate-100 transition-colors text-left"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(user?.role === 'ADMIN' ? '/admin/dashboard' : '/profile');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 rounded-lg hover:bg-slate-800/80 hover:text-slate-100 transition-colors text-left"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Platform Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 rounded-lg hover:bg-red-950/20 hover:text-red-300 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout Account</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
