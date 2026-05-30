import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, SlidersHorizontal, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllApplications, updateApplicationStatus } from '../../api/applications';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatDate';

const Applications = () => {
  const queryClient = useQueryClient();

  // Search & Filter parameters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown trigger states
  const [updateTarget, setUpdateTarget] = useState(null); // { appId, nextStatus }
  const [statusNote, setStatusNote] = useState('');
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // 1. Fetch Applications (Admin query)
  const { data: appsRes, isLoading } = useQuery({
    queryKey: ['adminApplications', searchQuery, status, page],
    queryFn: () => getAllApplications({
      search: searchQuery,
      status,
      page,
      limit: 10,
    }),
  });

  const applications = appsRes?.data || [];
  const pagination = appsRes?.pagination;

  // 2. Update Status Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }) => updateApplicationStatus(id, status, note),
    onSuccess: (res) => {
      toast.success(res.message || 'Application pipeline status updated!');
      setIsUpdateOpen(false);
      setStatusNote('');
      setUpdateTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to update pipeline stage.';
      toast.error(errMsg);
    },
  });

  const handleStatusSelectChange = (appId, nextStatus) => {
    setUpdateTarget({ appId, nextStatus });
    setStatusNote('');
    setIsUpdateOpen(true);
  };

  const handleStatusConfirm = (e) => {
    e.preventDefault();
    if (updateTarget.nextStatus === 'REJECTED' && (!statusNote || statusNote.trim().length < 5)) {
      toast.error('A rejection reason note of at least 5 characters is required.');
      return;
    }
    updateMutation.mutate({
      id: updateTarget.appId,
      status: updateTarget.nextStatus,
      note: statusNote,
    });
  };

  // Status Selector Option List
  const stageOptions = [
    { value: 'APPLIED', label: 'APPLIED' },
    { value: 'SHORTLISTED', label: 'SHORTLISTED' },
    { value: 'INTERVIEW', label: 'INTERVIEW' },
    { value: 'OFFER_SENT', label: 'OFFER SENT' },
    { value: 'HIRED', label: 'HIRED' },
    { value: 'REJECTED', label: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filters header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium">
        <div className="relative w-full sm:max-w-xs flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student, company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 font-bold" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">All Pipelines</option>
            {stageOptions.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>
        </div>
      </div>

      {/* Applications Data Grid */}
      <DataTable
        headers={['Candidate', 'Opportunity Details', 'Submission Date', 'Match score', 'Active stage', 'Pipeline Action']}
        data={applications}
        isLoading={isLoading}
        emptyMessage="No applications submissions found matching filters."
        renderRow={(app) => (
          <tr key={app.id} className="hover:bg-slate-800/10 border-b border-slate-800/40 select-none transition-colors text-left">
            {/* 1. Candidate Name */}
            <td className="px-5 py-4">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={app.user.avatarUrl}
                  firstName={app.user.firstName}
                  lastName={app.user.lastName}
                  size="sm"
                />
                <div>
                  <span className="font-extrabold text-slate-200 tracking-wide text-sm block">
                    {app.user.firstName} {app.user.lastName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{app.user.email}</span>
                </div>
              </div>
            </td>

            {/* 2. Opportunity details */}
            <td className="px-5 py-4">
              <div className="flex flex-col">
                <span className="font-bold text-slate-300 text-xs">{app.internship.title}</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">{app.internship.companyName}</span>
              </div>
            </td>

            {/* 3. Submission Date */}
            <td className="px-5 py-4 text-xs font-medium text-slate-400">
              {formatDate(app.createdAt)}
            </td>

            {/* 4. Match Index */}
            <td className="px-5 py-4 text-xs font-extrabold text-brand">
              {app.matchScore}% Overlap
            </td>

            {/* 5. Status Badge */}
            <td className="px-5 py-4">
              <Badge>{app.status}</Badge>
            </td>

            {/* 6. Pipeline Dropdown Selector */}
            <td className="px-5 py-4">
              {app.status === 'WITHDRAWN' ? (
                <span className="text-xs text-slate-600 font-semibold italic">Withdrawn by student</span>
              ) : (
                <select
                  value={app.status}
                  onChange={(e) => handleStatusSelectChange(app.id, e.target.value)}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                >
                  <option value="" disabled>Update Stage</option>
                  {stageOptions.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              )}
            </td>
          </tr>
        )}
      />

      {/* Pagination component */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 select-none">
          <span className="text-xs text-slate-500 font-semibold">
            Showing Page {page} of {pagination.totalPages}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Status Update Confirmation Modal with Stage Notes */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title="Update Pipeline Status"
        size="sm"
      >
        {updateTarget && (
          <form onSubmit={handleStatusConfirm} className="space-y-4 select-none text-left">
            <div className="flex items-start space-x-3 text-brand">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-brand" />
              <div>
                <h5 className="text-sm font-bold text-slate-100">Confirm pipeline shift</h5>
                <p className="text-xs text-slate-500 leading-normal mt-1">
                  You are about to shift this candidate's application status to <span className="font-extrabold text-slate-300">{updateTarget.nextStatus}</span>. This will send a notification.
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {updateTarget.nextStatus === 'REJECTED' ? 'Rejection Reason (Required)' : 'Stage Remark Note (Optional)'}
              </label>
              <textarea
                required={updateTarget.nextStatus === 'REJECTED'}
                rows={3}
                placeholder={updateTarget.nextStatus === 'REJECTED' ? "Provide a specific reason for rejection..." : "Add standard interview details or stage notes..."}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateMutation.isPending}
              >
                Apply Stage Shift
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
