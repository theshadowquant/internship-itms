import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login as loginAPI } from '../../api/auth';
import { useAuth } from '../../store/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ShieldCheck } from 'lucide-react';

// Validate parameters using Zod schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const AdminLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await loginAPI(data);
      if (res.success) {
        // Enforce strictly ADMIN role for this portal
        if (res.data.user.role !== 'ADMIN') {
          toast.error('Access Denied: This portal is reserved for administrators only.');
          setIsSubmitting(false);
          return;
        }

        toast.success(res.message || 'Administrator authenticated successfully!');
        
        // Save tokens and session record
        login({
          user: res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });

        // Redirect to admin console
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed. Please verify admin credentials.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* High-security crimson glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Main glass card container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 glass">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-red-600 flex items-center justify-center shadow-premium shadow-red-900/30 mb-3 animate-pulse">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">ShadowQuant Admin</h2>
          <span className="text-xs font-bold text-red-500 uppercase tracking-widest leading-none mt-1.5 flex items-center space-x-1">
            <span>Secure Operations Portal</span>
          </span>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Administrator Email"
            type="email"
            placeholder="admin@shadowquant.io"
            error={errors.email}
            {...register('email')}
          />
          <Input
            label="Secret Password"
            type="password"
            placeholder="••••••••"
            error={errors.password}
            {...register('password')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 border-red-700/50 shadow-red-500/20"
              isLoading={isSubmitting}
            >
              Authenticate & Launch Console
            </Button>
          </div>
        </form>

        {/* Back to student login routing links */}
        <div className="mt-6 text-center border-t border-slate-800/80 pt-5">
          <p className="text-xs text-slate-500 font-medium">
            Are you a student?{' '}
            <Link to="/login" className="text-brand hover:text-brand-light font-bold hover:underline transition-all">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
