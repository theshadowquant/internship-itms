import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getMyDailyLogs, 
  createDailyLog, 
  updateDailyLog, 
  deleteDailyLog 
} from '../../api/dailyLogs';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate } from '../../utils/formatDate';
import { computeHours } from '../../utils/computeHours';
import { exportCSV } from '../../utils/exportCSV';

const DailyLogs = () => {
  const queryClient = useQueryClient();

  // Local States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeLog, setActiveLog] = useState(null);

  // Form Parameters
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('17:00');
  const [workSummary, setWorkSummary] = useState('');
  const [mood, setMood] = useState('GOOD');

  // Live Hours calculation
  const [liveHours, setLiveHours] = useState(8);

  useEffect(() => {
    setLiveHours(computeHours(checkIn, checkOut));
  }, [checkIn, checkOut]);

  // 1. Fetch Daily Logs
  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['myDailyLogs'],
    queryFn: getMyDailyLogs,
  });

  const logs = logsRes?.data || [];

  // Mood Emoji Map
  const moodEmoji = {
    GREAT: '🤩',
    GOOD: '🙂',
    OKAY: '😐',
    DIFFICULT: '😞',
  };

  // 2. Add Log Mutation
  const addMutation = useMutation({
    mutationFn: createDailyLog,
    onSuccess: (res) => {
      toast.success(res.message || "Today's daily log recorded!");
      setIsAddOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['myDailyLogs'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to submit log entry.';
      toast.error(errMsg);
    },
  });

  // 3. Edit Log Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateDailyLog(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Daily log successfully updated.');
      setIsEditOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['myDailyLogs'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to update log entry.';
      toast.error(errMsg);
    },
  });

  // 4. Delete Log Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDailyLog,
    onSuccess: (res) => {
      toast.success(res.message || 'Log entry deleted.');
      setIsDeleteOpen(false);
      setActiveLog(null);
      queryClient.invalidateQueries({ queryKey: ['myDailyLogs'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to delete log.';
      toast.error(errMsg);
    },
  });

  const resetForm = () => {
    setLogDate(new Date().toISOString().split('T')[0]);
    setCheckIn('09:00');
    setCheckOut('17:00');
    setWorkSummary('');
    setMood('GOOD');
    setActiveLog(null);
  };

  const handleOpenEdit = (log) => {
    setActiveLog(log);
    // Convert UTC logDate database response to YYYY-MM-DD
    setLogDate(new Date(log.logDate).toISOString().split('T')[0]);
    setCheckIn(log.checkIn);
    setCheckOut(log.checkOut);
    setWorkSummary(log.workSummary);
    setMood(log.mood);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (log) => {
    setActiveLog(log);
    setIsDeleteOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (workSummary.length < 20) {
      toast.error('Work summary must be at least 20 characters.');
      return;
    }
    addMutation.mutate({
      logDate,
      checkIn,
      checkOut,
      workSummary,
      mood,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (workSummary.length < 20) {
      toast.error('Work summary must be at least 20 characters.');
      return;
    }
    editMutation.mutate({
      id: activeLog.id,
      data: {
        checkIn,
        checkOut,
        workSummary,
        mood,
      },
    });
  };

  const handleCSVExport = () => {
    if (logs.length === 0) {
      toast.error('No daily logs available to export.');
      return;
    }
    exportCSV(logs, 'my-daily-logs');
    toast.success('CSV Download initialized.');
  };

  return (
    <div className="space-y-6">
      {/* Upper Actions header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Work Tracking Logs</h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Submit daily hour logs and summaries to your supervisor.</p>
        </div>

        <div className="flex space-x-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCSVExport}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="flex items-center space-x-2 w-full sm:w-auto font-bold"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Record Daily Log</span>
          </Button>
        </div>
      </div>

      {/* Daily Logs Table */}
      <DataTable
        headers={['Shift Date', 'Check In/Out', 'Hours Worked', 'Mood', 'Approval status', 'Actions']}
        data={logs}
        isLoading={isLoading}
        emptyMessage="You have not submitted any daily logs yet."
        renderRow={(log) => {
          const isPending = log.status === 'PENDING';
          const isRejected = log.status === 'REJECTED';

          return (
            <React.Fragment key={log.id}>
              {/* Row grid */}
              <tr className="hover:bg-slate-800/10 select-none transition-colors border-b border-slate-800/40">
                {/* 1. Date */}
                <td className="px-5 py-4 font-bold text-slate-200">
                  {formatDate(log.logDate)}
                </td>

                {/* 2. Check In/Out */}
                <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                  {log.checkIn} — {log.checkOut}
                </td>

                {/* 3. Hours Worked */}
                <td className="px-5 py-4 text-xs font-extrabold text-brand">
                  {log.hoursWorked} hrs
                </td>

                {/* 4. Mood */}
                <td className="px-5 py-4 text-base">
                  <span title={log.mood}>{moodEmoji[log.mood] || '😐'}</span>
                </td>

                {/* 5. Status */}
                <td className="px-5 py-4">
                  <Badge>{log.status}</Badge>
                </td>

                {/* 6. Actions (Edit / Delete if PENDING) */}
                <td className="px-5 py-4">
                  {isPending ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEdit(log)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand/10 hover:text-brand border border-slate-700/50 text-slate-400 transition-colors focus:outline-none"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(log)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700/50 text-slate-400 transition-colors focus:outline-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-semibold select-none">Record Locked</span>
                  )}
                </td>
              </tr>

              {/* Sub-row expansion: Summary and Supervisor note (if rejected or if note exists) */}
              <tr className="bg-slate-950/10">
                <td colSpan="6" className="px-6 py-3 text-left">
                  <div className="space-y-2 select-none">
                    <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
                      <span className="font-bold uppercase tracking-wide text-slate-500 not-italic mr-1.5">Summary:</span>
                      {log.workSummary}
                    </p>

                    {/* Show supervisor note if available */}
                    {log.supervisorNote && (
                      <div className={`p-2.5 rounded-lg border text-xs leading-normal flex items-start space-x-2 ${
                        isRejected 
                          ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' 
                          : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <p>
                          <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Supervisor Remark:</span>
                          {log.supervisorNote}
                        </p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </React.Fragment>
          );
        }}
      />

      {/* Record log Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Daily Progress Log"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 select-none text-left">
          <Input
            label="Shift Date"
            type="date"
            required
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Clock In Time"
              type="time"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label="Clock Out Time"
              type="time"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          {/* Live Hours counter */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 uppercase tracking-wider">Computed Duration:</span>
            <span className="text-brand font-extrabold flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{liveHours} hours worked</span>
            </span>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Summary (Min 20 chars)</label>
            <textarea
              required
              rows={4}
              placeholder="Outline your tasks, milestones met, and boundaries crossed today..."
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
            />
            <span className="text-[10px] text-slate-500 text-right">{workSummary.length} characters</span>
          </div>

          {/* Mood buttons selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">How was your shift?</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(moodEmoji).map(([mName, emoji]) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => setMood(mName)}
                  className={`py-2 px-3 bg-slate-950 rounded-xl border text-xs font-bold transition-all focus:outline-none flex flex-col items-center gap-1 ${
                    mood === mName
                      ? 'border-brand text-slate-100 bg-brand/5'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{mName}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={addMutation.isPending}
            >
              Submit Daily Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit log Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Daily Log Entry"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 select-none text-left">
          <Input
            label="Shift Date"
            type="date"
            disabled
            value={logDate}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Clock In Time"
              type="time"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label="Clock Out Time"
              type="time"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          {/* Live Hours counter */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 uppercase tracking-wider">Computed Duration:</span>
            <span className="text-brand font-extrabold flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{liveHours} hours worked</span>
            </span>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Summary (Min 20 chars)</label>
            <textarea
              required
              rows={4}
              placeholder="Outline your tasks, milestones met, and boundaries crossed today..."
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
            />
            <span className="text-[10px] text-slate-500 text-right">{workSummary.length} characters</span>
          </div>

          {/* Mood selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">How was your shift?</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(moodEmoji).map(([mName, emoji]) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => setMood(mName)}
                  className={`py-2 px-3 bg-slate-950 rounded-xl border text-xs font-bold transition-all focus:outline-none flex flex-col items-center gap-1 ${
                    mood === mName
                      ? 'border-brand text-slate-100 bg-brand/5'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{mName}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={editMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Log Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Daily Log Record"
        size="sm"
      >
        <div className="space-y-5 select-none text-left">
          <div className="flex items-start space-x-3 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-slate-100">Permanently delete daily log?</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                You are about to delete your submitted daily log for {activeLog && formatDate(activeLog.logDate)}. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(activeLog.id)}
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DailyLogs;
