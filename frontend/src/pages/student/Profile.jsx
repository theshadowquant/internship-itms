import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Camera, Plus, X, Sparkles, BookOpen, Link2, Briefcase, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, uploadAvatar } from '../../api/users';
import { useAuth } from '../../store/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';

const Profile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  // Local States
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [avatarUploadPending, setAvatarUploadPending] = useState(false);

  // 1. Fetch own full profile
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const user = profileRes?.data;
  const studentProfile = user?.studentProfile;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Synchronize form values on mount / fetch success
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        collegeName: studentProfile?.collegeName || '',
        degree: studentProfile?.degree || '',
        branch: studentProfile?.branch || '',
        graduationYear: studentProfile?.graduationYear || '',
        gpa: studentProfile?.gpa || '',
        portfolioUrl: studentProfile?.portfolioUrl || '',
        linkedinUrl: studentProfile?.linkedinUrl || '',
        githubUrl: studentProfile?.githubUrl || '',
        resumeUrl: studentProfile?.resumeUrl || '',
        availability: studentProfile?.availability || 'IMMEDIATE',
        expectedStipend: studentProfile?.expectedStipend || '',
      });

      // Handle skills array parsing
      let parsedSkills = [];
      try {
        parsedSkills = studentProfile?.skills
          ? (typeof studentProfile.skills === 'string' ? JSON.parse(studentProfile.skills) : studentProfile.skills)
          : [];
      } catch (e) {
        parsedSkills = [];
      }
      setSkills(parsedSkills);
    }
  }, [user, reset]);

  // 2. Profile Update Mutation
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      toast.success(res.message || 'Profile saved!');
      
      // Update global context user details
      updateUser(res.data);
      
      // Refresh profile queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentAnalytics'] });
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || 'Failed to save changes.';
      toast.error(errMsg);
    },
  });

  // 3. Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (res) => {
      toast.success(res.message || 'Profile picture updated!');
      setAvatarUploadPending(false);

      // Sync avatar in header
      updateUser(res.data.user);

      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (err) => {
      setAvatarUploadPending(false);
      const errMsg = err.response?.data?.message || 'Photo upload failed.';
      toast.error(errMsg);
    },
  });

  // Photo change listener
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB.');
      return;
    }

    setAvatarUploadPending(true);
    const formData = new FormData();
    formData.append('avatar', file);
    avatarMutation.mutate(formData);
  };

  // Add skill tag
  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (!cleanSkill) return;

    if (skills.includes(cleanSkill)) {
      toast.error('Skill is already registered.');
      return;
    }

    setSkills([...skills, cleanSkill]);
    setNewSkill('');
  };

  // Delete skill tag
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const onSubmit = (data) => {
    // Send data along with active parsed skills array
    updateMutation.mutate({
      ...data,
      skills: JSON.stringify(skills),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none text-left">
      {/* Left Column: Avatar Photo & Strength score meter */}
      <div className="lg:col-span-1 space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-4">
            <Avatar
              src={user?.avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="xl"
            />
            {/* Overlay hover trigger */}
            <label
              htmlFor="avatarFile"
              className="absolute inset-0 bg-slate-950/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </label>
            <input
              type="file"
              id="avatarFile"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={avatarUploadPending}
            />
          </div>

          <h3 className="text-sm font-bold text-slate-100">
            {user?.firstName} {user?.lastName}
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">
            {user?.role} ACCOUNT
          </span>

          <p className="text-xs text-slate-500 mt-4 px-4 line-clamp-3 leading-relaxed">
            {user?.bio || 'No bio provided. Write a short bio in settings to strengthen your profile.'}
          </p>
        </div>

        {/* Strength Meter Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-brand" />
            <span>Profile score strength</span>
          </h4>

          <div className="flex justify-between items-baseline select-none">
            <span className="text-2xl font-extrabold text-slate-100">{studentProfile?.profileScore || 0}%</span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">of 100% metrics</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              style={{ width: `${studentProfile?.profileScore || 0}%` }}
              className="h-full bg-brand rounded-full transition-all duration-500 shadow-premium shadow-brand/20"
            />
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Fill your skills, academic records, and upload a resume file to achieve 100% profile score.
          </p>
        </div>
      </div>

      {/* Right Column: Profile forms sheets */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Personal Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <User className="h-4 w-4 text-brand" />
              <span>Personal details info</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Aarav"
                  error={errors.firstName}
                  {...register('firstName', { required: 'First name is required' })}
                />
                <Input
                  label="Last Name"
                  placeholder="Sharma"
                  error={errors.lastName}
                  {...register('lastName', { required: 'Last name is required' })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email (Read Only)"
                  type="email"
                  disabled
                  {...register('email')}
                />
                <Input
                  label="Contact Phone"
                  placeholder="+919876543210"
                  error={errors.phone}
                  {...register('phone')}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Short Biography</label>
                <textarea
                  rows={3}
                  placeholder="Tell quantitative placement supervisors about your interests and milestones..."
                  {...register('bio')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Academic Records */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-brand" />
              <span>Academic qualifications</span>
            </h3>

            <div className="space-y-4">
              <Input
                label="College Name"
                placeholder="Indian Institute of Technology (IIT) Delhi"
                {...register('collegeName')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Degree Name"
                  placeholder="B.Tech"
                  {...register('degree')}
                />
                <Input
                  label="Branch stream"
                  placeholder="Computer Science"
                  {...register('branch')}
                />
                <Input
                  label="Graduation Year"
                  type="number"
                  placeholder="2027"
                  {...register('graduationYear')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="GPA score"
                  type="number"
                  step="0.01"
                  placeholder="9.2"
                  {...register('gpa')}
                />
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability</label>
                  <select
                    {...register('availability')}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="IMMEDIATE">Immediate Availability</option>
                    <option value="ONE_MONTH">1 Month Notice</option>
                    <option value="THREE_MONTHS">3 Months Notice</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                </div>
                <Input
                  label="Expected Stipend (₹/mo)"
                  type="number"
                  placeholder="35000"
                  {...register('expectedStipend')}
                />
              </div>
            </div>
          </div>

          {/* 3. Skills tagger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-brand" />
              <span>Skills & tag list</span>
            </h3>

            <div className="space-y-4">
              {/* Skill Input Bar */}
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Input
                    label="Add New Skill"
                    placeholder="e.g. Playwright, Python, AWS"
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
                <Button variant="outline" size="md" onClick={handleAddSkill} className="py-2.5 px-4 font-bold shrink-0">
                  Add Tag
                </Button>
              </div>

              {/* Chips grid */}
              <div className="flex flex-wrap gap-2 pt-2 select-none">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-500 font-medium leading-relaxed">No skills listed yet. Add skills tags above to strengthen your profile.</span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-bold text-slate-300"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 rounded-full hover:bg-slate-800 hover:text-white transition-colors focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. Professional links */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium">
            <h3 className="text-sm font-bold text-slate-200 tracking-wide border-b border-slate-800 pb-3 mb-5 flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-brand" />
              <span>Links & Attachments</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Portfolio Website URL"
                placeholder="https://aaravsharma.dev"
                {...register('portfolioUrl')}
              />
              <Input
                label="LinkedIn Profile"
                placeholder="https://linkedin.com/in/aarav"
                {...register('linkedinUrl')}
              />
              <Input
                label="GitHub Profile"
                placeholder="https://github.com/aarav"
                {...register('githubUrl')}
              />
              <Input
                label="Resume URL (Link)"
                placeholder="https://drive.google.com/resume.pdf"
                {...register('resumeUrl')}
              />
            </div>
          </div>

          {/* Actions footer */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              className="px-8 py-2.5 font-bold"
              isLoading={updateMutation.isPending}
            >
              Save Profile changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
