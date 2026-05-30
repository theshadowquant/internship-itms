import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminUsers, toggleUserStatus } from '../../api/admin';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatDate';

const Users = () => {
  const queryClient = useQueryClient();

  // Local parameters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(search.trim());
      setPage(1); // reset to first page
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // 1. Fetch Users
  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery, role, page],
    queryFn: () => getAdminUsers({
      search: searchQuery,
      role,
      page,
      limit: 8,
    }),
  });

  const users = usersRes?.data || [];
  const pagination = usersRes?.pagination;

  // 2. Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: (res) => {
      toast.success(res.message || 'User account status toggled.');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to toggle account status.';
      toast.error(errMsg);
    },
  });

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium">
        <div className="relative w-full sm:max-w-xs flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Filter:</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">All Accounts</option>
            <option value="STUDENT">Student only</option>
            <option value="ADMIN">Admin only</option>
          </select>
        </div>
      </div>

      {/* Users Data Grid */}
      <DataTable
        headers={['Name', 'Email Address', 'Joined Date', 'Role', 'Account Status', 'Action']}
        data={users}
        isLoading={isLoading}
        emptyMessage="No user accounts registered matching active filters."
        renderRow={(usr) => (
          <tr key={usr.id} className="hover:bg-slate-800/10 transition-colors border-b border-slate-800/40 select-none">
            {/* 1. Name */}
            <td className="px-5 py-4">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={usr.avatarUrl}
                  firstName={usr.firstName}
                  lastName={usr.lastName}
                  size="sm"
                />
                <div>
                  <span className="font-extrabold text-slate-200 block tracking-wide">{usr.firstName} {usr.lastName}</span>
                  {usr.studentProfile?.collegeName && (
                    <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px] block mt-0.5">
                      {usr.studentProfile.collegeName}
                    </span>
                  )}
                </div>
              </div>
            </td>

            {/* 2. Email */}
            <td className="px-5 py-4 text-xs font-semibold text-slate-400">
              {usr.email}
            </td>

            {/* 3. Joined Date */}
            <td className="px-5 py-4 text-xs font-medium text-slate-500">
              {formatDate(usr.createdAt)}
            </td>

            {/* 4. Role */}
            <td className="px-5 py-4">
              <Badge>{usr.role}</Badge>
            </td>

            {/* 5. Active Status */}
            <td className="px-5 py-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                usr.isActive 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {usr.isActive ? 'ACTIVE' : 'LOCKED'}
              </span>
            </td>

            {/* 6. Action */}
            <td className="px-5 py-4">
              <Button
                variant={usr.isActive ? 'ghost' : 'outline'}
                size="sm"
                className={usr.isActive ? 'text-red-400 hover:bg-red-950/20 hover:text-red-300' : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/10'}
                isLoading={toggleMutation.isPending && toggleMutation.variables === usr.id}
                onClick={() => handleToggle(usr.id)}
              >
                {usr.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </td>
          </tr>
        )}
      />

      {/* Pagination control */}
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
    </div>
  );
};

export default Users;
