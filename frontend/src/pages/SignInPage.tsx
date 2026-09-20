import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Sparkles, CheckCircle2, HeartPulse, ArrowRight } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('demo@dischargeguard.com');
  const [password, setPassword] = useState('Demo123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setErrorMsg('Invalid email or password. Please use demo credentials below.');
    }
  };

  const handleTryDemo = () => {
    loginDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8">
      {/* Top Bar Header */}
      <header className="w-full max-w-6xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xl tracking-tight">DischargeGuard</span>
            <span className="text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full ml-2 font-medium">Healthcare Safety</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
          <HeartPulse className="w-4 h-4 text-sky-600" />
          <span>Patient-Centered Discharge Navigator</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md my-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          
          {/* Header & Tagline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mb-3 border border-sky-100">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to DischargeGuard</h2>
            <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
              Understand your discharge instructions. Feel confident about your recovery.
            </p>
          </div>

          {/* Prominent Demo Action Banner */}
          <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-sky-600 text-white rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Instant Demo Access</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Explore pre-loaded recovery plans, medications, and document parsing instantly.
                </p>
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="mt-3 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2 group"
                >
                  <span>Try Demo Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Or Manual Login</span>
          </div>

          {/* Form Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or User ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="demo@dischargeguard.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Demo Mode: Click 'Try Demo' or use password Demo123!"); }} className="text-xs font-medium text-sky-600 hover:text-sky-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              Sign In
            </button>
          </form>

          {/* Fictional Patient Info Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Demo uses fictional patient data (Alex Morgan)</span>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="text-xs text-slate-500 text-center py-4">
        © 2026 DischargeGuard Healthcare Safety • Patient Discharge Navigator
      </footer>
    </div>
  );
};
