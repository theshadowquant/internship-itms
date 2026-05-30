import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as registerAPI } from '../../api/auth';
import { useAuth } from '../../store/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Validate parameters using Zod schema
const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange', // Trigger real-time validation as user types
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...payload } = data;
    try {
      const res = await registerAPI(payload);
      if (res.success) {
        toast.success(res.message || 'Account created successfully!');
        
        // Auto-login upon successful registration
        login({
          user: res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });

        navigate('/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Glowing background circles */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Main glass card container */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 glass">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center shadow-premium shadow-brand/20 mb-2">
            <span className="font-extrabold text-white text-base font-serif">SQD</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">Register Account</h2>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">ITMS student registration</span>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="First name"
              error={errors.firstName}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              error={errors.lastName}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            error={errors.email}
            {...register('email')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              error={errors.password}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isSubmitting}
            >
              Register & Sign In
            </Button>
          </div>
        </form>

        {/* Login route links */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-brand-light font-bold hover:underline transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
