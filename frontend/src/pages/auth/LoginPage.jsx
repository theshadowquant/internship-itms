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

// Validate parameters using Zod schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
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
        toast.success(res.message || 'Logged in successfully!');
        
        // Save tokens and session record
        login({
          user: res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });

        // Redirect based on role
        if (res.data.user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Dynamic graphic glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Main glass card container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 glass">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center shadow-premium shadow-brand/20 mb-3">
            <span className="font-extrabold text-white text-lg font-serif">SQD</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">ShadowQuant Dynamics</h2>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">ITMS Platform</span>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            error={errors.email}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password}
            {...register('password')}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isSubmitting}
            >
              Sign In to Platform
            </Button>
          </div>
        </form>

        {/* Signup form routing links */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand hover:text-brand-light font-bold hover:underline transition-all">
              Sign Up Now
            </Link>
          </p>
          <div className="border-t border-slate-800/80 pt-4">
            <Link to="/admin/login" className="text-xs text-slate-400 hover:text-white font-bold transition-all">
              Access Administrative Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
