import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Calendar, MapPin, Sparkles, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getInternships, 
  createInternship, 
  updateInternship, 
  deleteInternship 
} from '../../api/internships';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate } from '../../utils/formatDate';

const Internships = () => {
  const queryClient = useQueryClient();

  // Local States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [activeInternship, setActiveInternship] = useState(null);

  // Form Parameters
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skillsRequired, setSkillsRequired] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [domain, setDomain] = useState('Engineering');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [stipendMin, setStipendMin] = useState('');
  const [stipendMax, setStipendMax] = useState('');
  const [openings, setOpenings] = useState(2);
  const [minGpa, setMinGpa] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // 1. Fetch all internships (including non-active for admin review)
  const { data: internshipsRes, isLoading } = useQuery({
    queryKey: ['adminInternships'],
    queryFn: () => getInternships({ status: 'ACTIVE' }), // lets load active ones
  });

  const internships = internshipsRes?.data || [];

  // 2. Create Posting Mutation
  const addMutation = useMutation({
    mutationFn: createInternship,
    onSuccess: (res) => {
      toast.success(res.message || 'New internship posting created!');
      setIsAddOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['adminInternships'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to post internship.';
      toast.error(errMsg);
    },
  });

  // 3. Edit Posting Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => updateInternship(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Internship details updated.');
      setIsEditOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['adminInternships'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to update details.';
      toast.error(errMsg);
    },
  });

  // 4. Soft Delete Mutation (status CLOSED)
  const deleteMutation = useMutation({
    mutationFn: deleteInternship,
    onSuccess: (res) => {
      toast.success(res.message || 'Internship posting soft-deleted.');
      setIsDeleteOpen(false);
      setActiveInternship(null);
      queryClient.invalidateQueries({ queryKey: ['adminInternships'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to delete posting.';
      toast.error(errMsg);
    },
  });

  const resetForm = () => {
    setTitle('');
    setCompanyName('');
    setCompanyLogo('');
    setDescription('');
    setResponsibilities('');
    setRequirements('');
    setSkillsRequired([]);
    setNewSkill('');
    setDomain('Engineering');
    setLocation('');
    setIsRemote(false);
    setDurationWeeks(12);
    setStipendMin('');
    setStipendMax('');
    setOpenings(2);
    setMinGpa('');
    setApplicationDeadline('');
    setStartDate('');
    setStatus('ACTIVE');
    setActiveInternship(null);
  };

  const handleOpenEdit = (internship) => {
    setActiveInternship(internship);
    setTitle(internship.title || '');
    setCompanyName(internship.companyName || '');
    setCompanyLogo(internship.companyLogo || '');
    setDescription(internship.description || '');
    setResponsibilities(internship.responsibilities || '');
    setRequirements(internship.requirements || '');
    
    let req = [];
    try {
      req = typeof internship.skillsRequired === 'string'
        ? JSON.parse(internship.skillsRequired)
        : internship.skillsRequired;
    } catch (e) {
      req = [];
    }
    setSkillsRequired(req || []);
    
    setDomain(internship.domain || 'Engineering');
    setLocation(internship.location || '');
    setIsRemote(internship.isRemote === true);
    setDurationWeeks(internship.durationWeeks || 12);
    setStipendMin(internship.stipendMin || '');
    setStipendMax(internship.stipendMax || '');
    setOpenings(internship.openings || 2);
    setMinGpa(internship.minGpa || '');
    setApplicationDeadline(new Date(internship.applicationDeadline).toISOString().split('T')[0]);
    setStartDate(new Date(internship.startDate).toISOString().split('T')[0]);
    setStatus(internship.status || 'ACTIVE');
    setIsEditOpen(true);
  };

  const handleOpenDelete = (internship) => {
    setActiveInternship(internship);
    setIsDeleteOpen(true);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (cleanSkill && !skillsRequired.includes(cleanSkill)) {
      setSkillsRequired([...skillsRequired, cleanSkill]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkillsRequired(skillsRequired.filter(s => s !== skill));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate({
      title, companyName, companyLogo, description, responsibilities, requirements,
      skillsRequired: JSON.stringify(skillsRequired), domain, location, isRemote,
      durationWeeks, stipendMin, stipendMax, openings, minGpa,
      applicationDeadline, startDate,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate({
      id: activeInternship.id,
      data: {
        title, companyName, companyLogo, description, responsibilities, requirements,
        skillsRequired: JSON.stringify(skillsRequired), domain, location, isRemote,
        durationWeeks, stipendMin, stipendMax, openings, minGpa,
        applicationDeadline, startDate, status,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium select-none">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Internships postings</h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Post and update active internship opportunities catalog.</p>
        </div>

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
          <span>Add Internship Opportunity</span>
        </Button>
      </div>

      {/* Grid listing Table */}
      <DataTable
        headers={['Role & Recruiter', 'Locationpref', 'Duration / open', 'Match requirements', 'Status', 'Actions']}
        data={internships}
        isLoading={isLoading}
        emptyMessage="No internships listings found."
        renderRow={(internship) => {
          let req = [];
          try {
            req = typeof internship.skillsRequired === 'string'
              ? JSON.parse(internship.skillsRequired)
              : internship.skillsRequired;
          } catch (e) {
            req = [];
          }

          return (
            <tr key={internship.id} className="hover:bg-slate-800/10 border-b border-slate-800/40 select-none transition-colors">
              {/* 1. Recruiter */}
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-200 tracking-wide text-sm">{internship.title}</span>
                  <span className="text-xs text-slate-500 font-semibold mt-0.5">{internship.companyName}</span>
                </div>
              </td>

              {/* 2. Location */}
              <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                <span className="inline-flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  <span>{internship.isRemote ? 'Remote' : internship.location}</span>
                </span>
              </td>

              {/* 3. Duration & Slots */}
              <td className="px-5 py-4 text-xs text-slate-400 font-medium">
                <div className="flex flex-col">
                  <span>{internship.durationWeeks} Weeks Term</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">{internship.openings} slots open</span>
                </div>
              </td>

              {/* 4. Skills required tags */}
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {req.slice(0, 3).map((sk, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-500 uppercase">
                      {sk}
                    </span>
                  ))}
                  {req.length > 3 && (
                    <span className="text-[9px] text-slate-600 font-bold shrink-0 self-center">+{req.length - 3}</span>
                  )}
                </div>
              </td>

              {/* 5. Status Badge */}
              <td className="px-5 py-4">
                <Badge>{internship.status}</Badge>
              </td>

              {/* 6. Action buttons (Edit/Delete) */}
              <td className="px-5 py-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenEdit(internship)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand/10 hover:text-brand border border-slate-700/50 text-slate-400 transition-colors focus:outline-none"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {internship.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleOpenDelete(internship)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700/50 text-slate-400 transition-colors focus:outline-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Add Posting Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Internship Opportunity"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 select-none text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Internship Role Title"
              placeholder="e.g. Frontend Engineer Intern"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Recruiting Company Name"
              placeholder="e.g. ShadowQuant Dynamics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placement Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Engineering">Engineering / Systems</option>
                <option value="Design">UI/UX & Product Design</option>
                <option value="Finance">Quantitative & Finance</option>
                <option value="Data">Data Analytics & BI</option>
              </select>
            </div>
            <Input
              label="Work Location"
              placeholder="e.g. Bangalore, KA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required={!isRemote}
              disabled={isRemote}
            />
            <div className="flex items-center space-x-2 pt-8 select-none">
              <input
                type="checkbox"
                id="isRemoteBox"
                checked={isRemote}
                onChange={(e) => {
                  setIsRemote(e.target.checked);
                  if (e.target.checked) setLocation('Remote');
                }}
                className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-brand"
              />
              <label htmlFor="isRemoteBox" className="text-xs font-semibold text-slate-300">Remote Posting</label>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Description</label>
            <textarea
              required
              rows={4}
              placeholder="Summarize the quantitative dynamic role milestones and target scopes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsibilities (Optional)</label>
              <textarea
                rows={2}
                placeholder="List key tasks..."
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Requirements (Optional)</label>
              <textarea
                rows={2}
                placeholder="List required GPA / college degree details..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
              />
            </div>
          </div>

          {/* Tag skills required */}
          <div className="space-y-2">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Input
                  label="Add Required Skill Tag"
                  placeholder="e.g. Node.js, SQL"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                />
              </div>
              <Button variant="outline" size="md" onClick={handleAddSkill} className="py-2.5 font-bold shrink-0">
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsRequired.map(sk => (
                <span key={sk} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                  <span>{sk}</span>
                  <button type="button" onClick={() => handleRemoveSkill(sk)} className="text-slate-500 hover:text-white transition-colors focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Stipend Min (₹/mo)"
              type="number"
              value={stipendMin}
              onChange={(e) => setStipendMin(e.target.value)}
            />
            <Input
              label="Stipend Max (₹/mo)"
              type="number"
              value={stipendMax}
              onChange={(e) => setStipendMax(e.target.value)}
            />
            <Input
              label="Total Openings"
              type="number"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              required
            />
            <Input
              label="Min GPA Cutoff"
              type="number"
              step="0.1"
              value={minGpa}
              onChange={(e) => setMinGpa(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Application Deadline Date"
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              required
            />
            <Input
              label="Placement Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800/60">
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={addMutation.isPending}
            >
              Post Internship Opportunity
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Posting Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Internship Details"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 select-none text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Internship Role Title"
              placeholder="e.g. Frontend Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Recruiting Company Name"
              placeholder="e.g. ShadowQuant Dynamics"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
                <option value="Data">Data Science</option>
              </select>
            </div>
            <Input
              label="Work Location"
              placeholder="e.g. Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required={!isRemote}
              disabled={isRemote}
            />
            <div className="flex items-center space-x-2 pt-8 select-none">
              <input
                type="checkbox"
                id="isRemoteBoxEdit"
                checked={isRemote}
                onChange={(e) => {
                  setIsRemote(e.target.checked);
                  if (e.target.checked) setLocation('Remote');
                }}
                className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-brand"
              />
              <label htmlFor="isRemoteBoxEdit" className="text-xs font-semibold text-slate-300">Remote</label>
            </div>
            <div className="flex flex-col space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Description</label>
            <textarea
              required
              rows={4}
              placeholder="Job descriptions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
            />
          </div>

          {/* Tag skills required */}
          <div className="space-y-2">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Input
                  label="Add Required Skill Tag"
                  placeholder="e.g. Node.js"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                />
              </div>
              <Button variant="outline" size="md" onClick={handleAddSkill} className="py-2.5 font-bold shrink-0">
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsRequired.map(sk => (
                <span key={sk} className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                  <span>{sk}</span>
                  <button type="button" onClick={() => handleRemoveSkill(sk)} className="text-slate-500 hover:text-white transition-colors focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Stipend Min (₹/mo)"
              type="number"
              value={stipendMin}
              onChange={(e) => setStipendMin(e.target.value)}
            />
            <Input
              label="Stipend Max (₹/mo)"
              type="number"
              value={stipendMax}
              onChange={(e) => setStipendMax(e.target.value)}
            />
            <Input
              label="Total Openings"
              type="number"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              required
            />
            <Input
              label="Min GPA Cutoff"
              type="number"
              step="0.1"
              value={minGpa}
              onChange={(e) => setMinGpa(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Application Deadline Date"
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              required
            />
            <Input
              label="Placement Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800/60">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={editMutation.isPending}
            >
              Save Posting Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Posting Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Soft Delete Opportunity"
        size="sm"
      >
        <div className="space-y-5 select-none text-left">
          <div className="flex items-start space-x-3 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-slate-100">Are you sure?</h5>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                You are about to soft delete this internship opportunity. The status will be set to CLOSED, and new applications will be blocked.
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
              onClick={() => deleteMutation.mutate(activeInternship.id)}
            >
              Soft Delete Opportunity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Internships;
