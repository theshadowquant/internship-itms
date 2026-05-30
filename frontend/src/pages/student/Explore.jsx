import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Calendar, CreditCard, ChevronRight, Briefcase, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getInternships, getRecommendedInternships } from '../../api/internships';
import { getProfile } from '../../api/users';
import { applyToInternship, getMyApplications } from '../../api/applications';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate } from '../../utils/formatDate';

const Explore = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const searchParam = searchParams.get('search') || '';
  const domainParam = searchParams.get('domain') || '';
  const isRemoteParam = searchParams.get('isRemote') || '';
  
  // Local States
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [activeChip, setActiveChip] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Form States for apply
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // 1. Fetch Student Profile to calculate skills overlap matching
  const { data: profileRes } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const studentProfile = profileRes?.data?.studentProfile;
  let studentSkills = [];
  try {
    studentSkills = studentProfile?.skills 
      ? (typeof studentProfile.skills === 'string' ? JSON.parse(studentProfile.skills) : studentProfile.skills)
      : [];
  } catch (e) {
    studentSkills = [];
  }

  // 2. Fetch User Applications to disable already-applied buttons
  const { data: appsRes } = useQuery({
    queryKey: ['myApplications'],
    queryFn: getMyApplications,
  });
  const myApplications = appsRes?.data || [];

  // Filter chips definitions
  const chips = [
    { name: 'All', filters: {} },
    { name: 'Tech', filters: { domain: 'Engineering' } },
    { name: 'Design', filters: { domain: 'Design' } },
    { name: 'Finance', filters: { domain: 'Finance' } },
    { name: 'Remote', filters: { isRemote: 'true' } },
  ];

  // Sync searchQuery with URL params
  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  // Handle chips clicks
  const handleChipClick = (chip) => {
    setActiveChip(chip.name);
    const newParams = {};
    if (searchQuery) newParams.search = searchQuery;
    if (chip.filters.domain) newParams.domain = chip.filters.domain;
    if (chip.filters.isRemote) newParams.isRemote = chip.filters.isRemote;
    setSearchParams(newParams);
  };

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const newParams = {};
      if (searchQuery.trim()) newParams.search = searchQuery.trim();
      if (domainParam) newParams.domain = domainParam;
      if (isRemoteParam) newParams.isRemote = isRemoteParam;
      setSearchParams(newParams);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 3. Fetch Internships with filters
  const { data: internshipsRes, isLoading } = useQuery({
    queryKey: ['internships', searchParam, domainParam, isRemoteParam, sortBy],
    queryFn: () => getInternships({
      search: searchParam,
      domain: domainParam,
      isRemote: isRemoteParam,
      sort: sortBy,
      order: 'desc',
    }),
  });

  const internships = internshipsRes?.data || [];

  // 4. Match Score Calculator Utility (Visual overlapping percentage)
  const calculateMatchScore = (skillsRequired) => {
    if (!studentSkills || studentSkills.length === 0) return 0;
    let req = [];
    try {
      req = typeof skillsRequired === 'string' ? JSON.parse(skillsRequired) : skillsRequired;
    } catch (e) {
      req = [];
    }

    if (!Array.isArray(req) || req.length === 0) return 100;
    const overlap = req.filter(skill => studentSkills.includes(skill));
    return Math.round((overlap.length / req.length) * 100);
  };

  // 5. Apply Mutation
  const applyMutation = useMutation({
    mutationFn: applyToInternship,
    onSuccess: (res) => {
      toast.success(res.message || 'Application submitted successfully!');
      setIsApplyOpen(false);
      setCoverLetter('');
      // Invalidate queries to refresh button states
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to submit application.';
      toast.error(errMsg);
    },
  });

  const handleOpenApply = (internship) => {
    setSelectedInternship(internship);
    setResumeUrl(studentProfile?.resumeUrl || '');
    setCoverLetter('');
    setIsApplyOpen(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!coverLetter || coverLetter.length < 20) {
      toast.error('Please enter a cover letter of at least 20 characters.');
      return;
    }
    applyMutation.mutate({
      internshipId: selectedInternship.id,
      coverLetter,
      resumeUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-premium space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, description or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            >
              <option value="createdAt">Newest Posting</option>
              <option value="stipendMax">Highest Stipend</option>
              <option value="durationWeeks">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Chips row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 select-none">
          {chips.map(chip => (
            <button
              key={chip.name}
              onClick={() => handleChipClick(chip)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 focus:outline-none ${
                activeChip === chip.name
                  ? 'bg-brand text-white shadow-premium'
                  : 'bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {chip.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20" />
              <div className="flex space-x-2 pt-2">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-8 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <EmptyState
          title="No Internships Found"
          description="We couldn't find any active internships matching your filters. Try adjusting your query or filters chip options."
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setActiveChip('All');
            setSearchParams({});
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
          {internships.map((internship) => {
            const hasApplied = myApplications.some(app => app.internshipId === internship.id);
            const isDeadlinePassed = new Date() > new Date(internship.applicationDeadline);
            const matchScore = calculateMatchScore(internship.skillsRequired);

            let required = [];
            try {
              required = typeof internship.skillsRequired === 'string'
                ? JSON.parse(internship.skillsRequired)
                : internship.skillsRequired;
            } catch (e) {
              required = [];
            }

            return (
              <motion.div
                key={internship.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-slate-100 tracking-wide hover:text-brand transition-colors cursor-pointer">
                        {internship.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">{internship.companyName}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1.5">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Match Index</span>
                        <span className={`text-xs font-extrabold ${
                          matchScore >= 70 ? 'text-emerald-400' : (matchScore >= 40 ? 'text-amber-400' : 'text-slate-400')
                        }`}>
                          {matchScore}% Match
                        </span>
                      </div>
                      <div className="h-1.5 w-16 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          style={{ width: `${matchScore}%` }}
                          className={`h-full rounded-full ${
                            matchScore >= 70 ? 'bg-emerald-500' : (matchScore >= 40 ? 'bg-amber-500' : 'bg-slate-500')
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Descriptions */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {internship.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {required.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400">
                        {skill}
                      </span>
                    ))}
                    {required.length > 4 && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-500">
                        +{required.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Parameters Details Row */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-800/60 pt-4 text-xs font-medium text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{internship.isRemote ? 'Remote' : internship.location}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{internship.durationWeeks} Weeks</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {internship.stipendMin ? `₹${Math.round(internship.stipendMin / 1000)}k/mo` : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Trigger Action */}
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-4 mt-6">
                  <span className="text-[10px] font-bold text-slate-500">
                    DEADLINE: {formatDate(internship.applicationDeadline)}
                  </span>

                  {hasApplied ? (
                    <Button variant="outline" size="sm" className="px-5 shrink-0" disabled>
                      Applied
                    </Button>
                  ) : isDeadlinePassed ? (
                    <Button variant="outline" size="sm" className="px-5 shrink-0 text-red-500 border-red-500/20" disabled>
                      Deadline Passed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="px-5 shrink-0"
                      onClick={() => handleOpenApply(internship)}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive Apply Modal Form */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title={selectedInternship ? `Apply: ${selectedInternship.title}` : 'Submit Application'}
        size="md"
      >
        {selectedInternship && (
          <form onSubmit={handleApplySubmit} className="space-y-5 select-none text-left">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-xs font-bold font-mono">SQ</div>
              <div>
                <h5 className="text-xs font-bold text-slate-200">{selectedInternship.companyName}</h5>
                <span className="text-[10px] text-slate-500 block">{selectedInternship.location} • {selectedInternship.durationWeeks} Weeks</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cover Letter (Min 20 chars)</label>
              <textarea
                required
                rows={5}
                placeholder="Explain why you are the perfect fit for this quantitative dynamic placement role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
              />
              <span className="text-[10px] text-slate-500 text-right">{coverLetter.length} characters</span>
            </div>

            <Input
              label="Resume URL Link"
              placeholder="e.g. https://drive.google.com/your-resume.pdf"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={applyMutation.isPending}
              >
                Submit Application
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Explore;
