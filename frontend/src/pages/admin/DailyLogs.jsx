import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { approveDailyLog, rejectDailyLog } from '../../api/dailyLogs';
import { getPendingLogs } from '../../api/admin';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatDate';

const DailyLogs = () => {
  const queryClient = useQueryClient();

  // Rejection modal trigger states
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [supervisorNote, setSupervisorNote] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Approval with optional note trigger states
  const [approveTargetId, setApproveTargetId] = useState(null);
  const [approveNote, setApproveNote] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);

  // Mood Emoji Map
  const moodEmoji = {
    GREAT: '🤩',
    GOOD: '🙂',
    OKAY: '😐',
    DIFFICULT: '😞',
  };

  // 1. Fetch Pending Logs
  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['adminPendingLogs'],
    queryFn: getPendingLogs,
  });

  const pendingLogs = logsRes?.data || [];

  // 2. Approve Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, note }) => approveDailyLog(id, note),
    onSuccess: (res) => {
      toast.success(res.message || 'Daily log successfully approved!');
      setIsApproveOpen(false);
      setApproveNote('');
      setApproveTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['adminPendingLogs'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to approve daily log.';
      toast.error(errMsg);
    },
  });

  // 3. Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => rejectDailyLog(id, note),
    onSuccess: (res) => {
      toast.success(res.message || 'Daily log rejected.');
      setIsRejectOpen(false);
      setSupervisorNote('');
      setRejectTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['adminPendingLogs'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to reject daily log.';
      toast.error(errMsg);
    },
  });

  const handleOpenApprove = (id) => {
    setApproveTargetId(id);
    setApproveNote('');
    setIsApproveOpen(true);
  };

  const handleApproveConfirm = (e) => {
    e.preventDefault();
    approveMutation.mutate({
      id: approveTargetId,
      note: approveNote,
    });
  };

  const handleOpenReject = (id) => {
    setRejectTargetId(id);
    setSupervisorNote('');
    setIsRejectOpen(true);
  };

  const handleRejectConfirm = (e) => {
    e.preventDefault();
    if (!supervisorNote || supervisorNote.trim().length < 5) {
      toast.error('A supervisor rejection note of at least 5 characters is required.');
      return;
    }
    rejectMutation.mutate({
      id: rejectTargetId,
      note: supervisorNote,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upper Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium select-none text-left">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Pending shift logs reviews</h3>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">Approve or reject submitted student work hours and summaries.</p>
      </div>

      {/* Pending logs data grid */}
      <DataTable
        headers={['Student', 'Shift Date', 'Check In/Out', 'Hours Worked', 'Mood', 'Actions']}
        data={pendingLogs}
        isLoading={isLoading}
        emptyMessage="Excellent! No daily progress logs are currently awaiting review."
        renderRow={(log) => (
          <React.Fragment key={log.id}>
            {/* Main Row */}
            <tr className="hover:bg-slate-800/10 border-b border-slate-800/40 select-none transition-colors text-left">
              {/* 1. Student Name */}
              <td className="px-5 py-4">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={log.user.avatarUrl}
                    firstName={log.user.firstName}
                    lastName={log.user.lastName}
                    size="sm"
                  />
                  <div>
                    <span className="font-extrabold text-slate-200 tracking-wide text-sm block">
                      {log.user.firstName} {log.user.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{log.user.email}</span>
                  </div>
                </div>
              </td>

              {/* 2. Date */}
              <td className="px-5 py-4 text-xs font-bold text-slate-300">
                {formatDate(log.logDate)}
              </td>

              {/* 3. Check In/Out */}
              <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                {log.checkIn} — {log.checkOut}
              </td>

              {/* 4. Hours Worked */}
              <td className="px-5 py-4 text-xs font-extrabold text-brand">
                {log.hoursWorked} hrs
              </td>

              {/* 5. Mood */}
              <td className="px-5 py-4 text-base">
                <span title={log.mood}>{moodEmoji[log.mood] || '😐'}</span>
              </td>

              {/* 6. Approve / Reject triggers */}
              <td className="px-5 py-4">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 px-3 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900/20 hover:text-emerald-300 flex items-center space-x-1 font-bold"
                    onClick={() => handleOpenApprove(log.id)}
                  >
                    <Check className="h-4.5 w-4.5" />
                    <span>Approve</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 px-3 bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/20 hover:text-red-300 flex items-center space-x-1 font-bold"
                    onClick={() => handleOpenReject(log.id)}
                  >
                    <X className="h-4.5 w-4.5" />
                    <span>Reject</span>
                  </Button>
                </div>
              </td>
            </tr>

            {/* Sub-row detailing Summary */}
            <tr className="bg-slate-950/10">
              <td colSpan="6" className="px-8 py-3 text-left">
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mr-2">Work Summary:</span>
                  {log.workSummary}
                </p>
              </td>
            </tr>
          </React.Fragment>
        )}
      />

      {/* Approve Log with optional remark Modal */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Approve Daily Work Log"
        size="sm"
      >
        {approveTargetId && (
          <form onSubmit={handleApproveConfirm} className="space-y-4 select-none text-left">
            <div className="flex items-start space-x-3 text-emerald-400">
              <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <h5 className="text-sm font-bold text-slate-100">Confirm log approval</h5>
                <p className="text-xs text-slate-500 leading-normal mt-1">
                  You are approving this daily log. The shifts hours will be aggregated in the student's chart.
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supervisor Remark (Optional)</label>
              <textarea
                rows={3}
                placeholder="Add a word of feedback or encouragement..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setIsApproveOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={approveMutation.isPending}
              >
                Approve Shift Log
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Log with required note Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Daily Work Log"
        size="sm"
      >
        {rejectTargetId && (
          <form onSubmit={handleRejectConfirm} className="space-y-4 select-none text-left">
            <div className="flex items-start space-x-3 text-red-500">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-100">Confirm log rejection</h5>
                <p className="text-xs text-slate-500 leading-normal mt-1">
                  Rejections require a supervisor note so the student knows what to adjust before re-submitting.
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejection Reason Note (Required)</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Please provide a more descriptive summary..."
                value={supervisorNote}
                onChange={(e) => setSupervisorNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={rejectMutation.isPending}
              >
                Reject Shift Log
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default DailyLogs;
