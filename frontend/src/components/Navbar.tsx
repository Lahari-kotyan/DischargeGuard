import React from 'react';
import { Menu, ShieldAlert, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDischarge } from '../context/DischargeContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { dischargeData } = useDischarge();
  const navigate = useNavigate();

  const unresolvedFlags = dischargeData.flagged_issues.filter(f => !f.isResolved);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Hospital Recovery & Discharge Safety Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Flagged Review Items Banner Button */}
        {unresolvedFlags.length > 0 && (
          <button
            onClick={() => navigate('/review')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-medium transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="hidden md:inline">{unresolvedFlags.length} Need Review</span>
            <span className="md:hidden">{unresolvedFlags.length}</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full"></span>
        </button>

        {/* Patient Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-900">{user?.name || 'Alex Morgan'}</p>
            <p className="text-[11px] text-slate-500">{user?.hospitalName || 'St. Jude Hospital'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs border border-sky-200">
            AM
          </div>
        </div>
      </div>
    </header>
  );
};
