import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PageWrapper from './PageWrapper';
import ErrorBoundary from '../shared/ErrorBoundary';

const Layout = () => {
  return (
    <div className="flex w-full min-h-screen bg-slate-950 text-slate-100 font-sans transition-colors duration-200">
      {/* Platform Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Navbar */}
        <Topbar />

        {/* Dynamic Nested Content Page */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <ErrorBoundary>
            <PageWrapper>
              <Outlet />
            </PageWrapper>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
