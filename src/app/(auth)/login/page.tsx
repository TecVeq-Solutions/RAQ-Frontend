import LoginForm from '@/components/auth/LoginForm';
import { Suspense } from 'react';
import { Shield, TrendingUp, Boxes, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Branding / Value Props (Visible on LG screens) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col text-white space-y-6 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold w-fit">
            <Shield className="w-3.5 h-3.5" />
            Enterprise Role-Based Access
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Integrated Business & <span className="text-[#16A34A]">Accounting Portal</span>
          </h2>
          
          <p className="text-slate-400 text-base leading-relaxed">
            Manage your sales workflows, purchase orders, real-time stock inventory, and financial reports seamlessly with granular role controls.
          </p>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
              <span>Full Admin, Staff, and Viewer permission boundaries</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <TrendingUp className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
              <span>Real-time financial analytics and turnover monitoring</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Boxes className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
              <span>Stock reorder level tracking and supplier management</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="w-full lg:col-span-6 flex justify-center">
          <Suspense fallback={<div className="text-white">Loading login form...</div>}>
            <LoginForm />
          </Suspense>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
        &copy; {new Date().getFullYear()} Tecveq Enterprise Suite. All rights reserved.
      </div>
    </div>
  );
}
