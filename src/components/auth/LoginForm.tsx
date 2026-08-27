'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const sessionExpired = searchParams.get('session_expired');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    sessionExpired ? 'Your session has expired. Please sign in again.' : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login({ email, password });
      window.location.href = redirectUrl;
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0] as string[];
        setError(firstError[0] || 'Authentication failed.');
      } else {
        setError('Unable to connect to the server. Please verify backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password');
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 transition-all">
      {/* Header & Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 shadow-sm ring-1 ring-emerald-100">
          <ShieldCheck className="w-8 h-8 text-[#16A34A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
          Tecveq Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sales, Purchase, Stock & Accounting System
        </p>
      </div>

      {/* Error Alert Display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@tecveq.com"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <span className="text-xs text-slate-400">Min. 6 characters</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl text-white font-semibold bg-[#16A34A] hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <UserCheck className="w-5 h-5" />
              <span>Sign In to Dashboard</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
          Quick Demo Login (Password: <span className="font-mono text-slate-700 lowercase">password</span>)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillTestCredentials('admin@tecveq.com')}
            className="px-2 py-2 text-xs font-medium text-[#0F172A] bg-slate-100 hover:bg-emerald-50 hover:text-[#16A34A] hover:border-[#16A34A] border border-slate-200 rounded-lg transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="font-bold">Admin</span>
            <span className="text-[10px] text-slate-500">Full Access</span>
          </button>
          <button
            type="button"
            onClick={() => fillTestCredentials('staff@tecveq.com')}
            className="px-2 py-2 text-xs font-medium text-[#0F172A] bg-slate-100 hover:bg-emerald-50 hover:text-[#16A34A] hover:border-[#16A34A] border border-slate-200 rounded-lg transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="font-bold">Staff</span>
            <span className="text-[10px] text-slate-500">Sales/Stock</span>
          </button>
          <button
            type="button"
            onClick={() => fillTestCredentials('viewer@tecveq.com')}
            className="px-2 py-2 text-xs font-medium text-[#0F172A] bg-slate-100 hover:bg-emerald-50 hover:text-[#16A34A] hover:border-[#16A34A] border border-slate-200 rounded-lg transition-all text-center flex flex-col items-center gap-1"
          >
            <span className="font-bold">Viewer</span>
            <span className="text-[10px] text-slate-500">Read-Only</span>
          </button>
        </div>
      </div>
    </div>
  );
}
