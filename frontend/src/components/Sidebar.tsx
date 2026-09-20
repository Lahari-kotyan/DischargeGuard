import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Pill, 
  CalendarDays, 
  UploadCloud, 
  ClipboardCheck, 
  FolderArchive, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDischarge } from '../context/DischargeContext';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { dischargeData } = useDischarge();
  const navigate = useNavigate();

  const unresolvedFlags = dischargeData.flagged_issues.filter(f => !f.isResolved).length;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Discharge Plan', path: '/discharge-plan', icon: FileText },
    { label: 'Medications', path: '/medications', icon: Pill, badge: dischargeData.medications.filter(m => m.needs_review).length },
    { label: 'Follow-Up Appointments', path: '/appointments', icon: CalendarDays },
    { label: 'Upload Discharge Summary', path: '/upload', icon: UploadCloud },
    { label: 'Review & Verify', path: '/review', icon: ClipboardCheck, badge: unresolvedFlags, badgeColor: 'bg-amber-500' },
    { label: 'My Documents', path: '/documents', icon: FolderArchive },
    { label: 'Profile & Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`
      fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Top Logo & App Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg tracking-tight leading-none flex items-center gap-1.5">
              DischargeGuard
            </h1>
            <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Patient Portal
            </span>
          </div>
        </div>

        {/* Demo Mode Notification Badge */}
        <div className="mx-4 mt-4 p-2.5 bg-sky-50/80 border border-sky-100 rounded-xl flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Demo Active</span> • Fictional Patient
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) => `
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : item.badgeColor ? `${item.badgeColor} text-white` : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AM'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{user?.name || 'Alex Morgan'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.mrn || 'MRN-8941029'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
