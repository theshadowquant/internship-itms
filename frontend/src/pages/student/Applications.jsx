import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Clock, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyApplications, withdrawApplication } from '../../api/applications';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const Applications = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  // 1. Fetch Student Applications
  const { data: appsRes, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: getMyApplications,
  });

  const applications = appsRes?.data || [];

  // Filter tabs definitions
  const tabs = ['All', 'Active', 'Hired', 'Rejected'];

  const filteredApps = applications.filter((app) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Hired') return app.status === 'HIRED';
    if (activeTab === 'Rejected') return app.status === 'REJECTED';
    if (activeTab === 'Active') {
      return ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER_SENT'].includes(app.status);
    }
    return true;
  });

  // 2. Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: (res) => {
      toast.success(res.message || 'Application successfully withdrawn.');
      setWithdrawTarget(null);
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to withdraw application.';
      toast.error(errMsg);
    },
  });

  const handleWithdrawConfirm = () => {
    if (withdrawTarget) {
      withdrawMutation.mutate(withdrawTarget);
    }
  };

  const handleRowClick = (appId) => {
    setExpandedRow(expandedRow === appId ? null : appId);
  };

  return (
    <div className="space-y-6">
      {/* Filters tab buttons */}
      <div className="flex border-b border-slate-800 select-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setExpandedRow(null);
            }}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none ${
              activeTab === tab
                ? 'border-brand text-brand font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Applications Data Grid */}
      <DataTable
        headers={['Company & Role', 'Applied Date', 'Match score', 'Pipeline stage', 'Timeline', 'Actions']}
        data={filteredApps}
        isLoading={isLoading}
        emptyMessage={`No ${activeTab === 'All' ? '' : activeTab.toLowerCase()} applications available.`}
        renderRow={(app) => {
          const isExpanded = expandedRow === app.id;
          // Can withdraw if application is in active phase
          const canWithdraw = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER_SENT'].includes(app.status);
          
          let parsedHistory = [];
          try {
            parsedHistory = Array.isArray(app.stageHistory) 
              ? app.stageHistory 
              : (typeof app.stageHistory === 'string' ? JSON.parse(app.stageHistory) : []);
          } catch (e) {
            parsedHistory = [];
          }

          return (
            <React.Fragment key={app.id}>
              {/* Row Grid content */}
              <tr className={`hover:bg-slate-800/20 cursor-pointer select-none transition-colors ${
                isExpanded && 'bg-slate-800/10'
              }`}>
                {/* 1. Company & Role */}
                <td className="px-5 py-4.5" onClick={() => handleRowClick(app.id)}>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-200 tracking-wide text-sm">{app.internship.title}</span>
                    <span className="text-xs text-slate-500 font-semibold mt-0.5">{app.internship.companyName}</span>
                  </div>
                </td>

                {/* 2. Date */}
                <td className="px-5 py-4.5 text-xs font-medium text-slate-400" onClick={() => handleRowClick(app.id)}>
                  {formatDate(app.createdAt)}
                </td>

                {/* 3. Match score progress */}
                <td className="px-5 py-4.5" onClick={() => handleRowClick(app.id)}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-300">{app.matchScore}%</span>
                    <div className="h-1 w-12 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shrink-0">
                      <div
                        style={{ width: `${app.matchScore}%` }}
                        className={`h-full rounded-full ${
                          app.matchScore >= 70 ? 'bg-emerald-500' : (app.matchScore >= 40 ? 'bg-amber-500' : 'bg-slate-500')
                        }`}
                      />
                    </div>
                  </div>
                </td>

                {/* 4. Stage Status Badge */}
                <td className="px-5 py-4.5" onClick={() => handleRowClick(app.id)}>
                  <Badge>{app.status}</Badge>
                </td>

                {/* 5. Timeline toggle indicator */}
                <td className="px-5 py-4.5" onClick={() => handleRowClick(app.id)}>
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-brand hover:text-brand-light">
                    <span>{isExpanded ? 'Hide' : 'View'}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </td>

                {/* 6. Action: Withdraw */}
                <td className="px-5 py-4.5">
                  {canWithdraw ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-950/20 hover:text-red-300 px-3 py-1 font-semibold"
                      onClick={() => setWithdrawTarget(app.id)}
                    >
                      Withdraw
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-600 font-semibold">Locked</span>
                  )}
                </td>
              </tr>

              {/* Row Timeline Expansion dropdown */}
              {isExpanded && (
                <tr className="bg-slate-950/30">
                  <td colSpan="6" className="px-8 py-5 border-t border-slate-800/40">
                    <div className="space-y-4 text-left select-none animate-fade-slide-up">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                        <Clock className="h-4 w-4 text-brand" />
                        <span>Application Stage History Timeline</span>
                      </h5>

                      <div className="relative border-l-2 border-slate-800 ml-2.5 py-1 pl-6 space-y-5">
                        {parsedHistory.length === 0 ? (
                          <span className="text-xs text-slate-500 font-medium">No timeline records registered.</span>
                        ) : (
                          parsedHistory.map((history, hIdx) => (
                            <div key={hIdx} className="relative">
                              {/* Bullet circle */}
                              <div className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border bg-slate-900 ${
                                hIdx === parsedHistory.length - 1 ? 'border-brand ring-4 ring-brand/10' : 'border-slate-700'
                              }`} />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{history.stage}</span>
                                  <span className="text-[10px] text-slate-600 font-medium">{formatDateTime(history.timestamp)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 leading-normal">
                                  {history.note || `Stage status changed to ${history.stage}`}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        }}
      />

      {/* Confirmation withdrawal Modal */}
      <Modal
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        title="Withdraw Application"
        size="sm"
      >
        <div className="space-y-5 select-none text-left">
          <div className="flex items-start space-x-3 text-amber-500">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-slate-100">Are you absolutely sure?</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Withdrawing your application is permanent. You will not be able to re-apply for this placement slot. The opening count will be incremented back.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setWithdrawTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={withdrawMutation.isPending}
              onClick={handleWithdrawConfirm}
            >
              Withdraw Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Applications;
