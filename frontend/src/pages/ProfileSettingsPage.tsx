import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  User, 
  Mail, 
  ShieldCheck, 
  Bell, 
  Lock, 
  LogOut, 
  Building2, 
  Phone, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [medReminders, setMedReminders] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
            <Settings className="w-3.5 h-3.5 text-sky-600" />
            <span>Account & Patient Profile Settings</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profile & Preferences</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Manage your personal healthcare profile, contact info, and notification settings.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Demo Account</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white font-bold flex items-center justify-center text-xl shadow-md shadow-sky-200 shrink-0">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AM'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{user?.name || 'Alex Morgan'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email || 'demo@dischargeguard.com'}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Fictional Demo Patient Active</span>
            </span>
          </div>
        </div>

        {/* Basic Patient Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Full Name</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.name || 'Alex Morgan'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>Email Address</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.email || 'demo@dischargeguard.com'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Medical Record Number (MRN)</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.mrn || 'MRN-8941029'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Date of Birth</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.dob || 'October 14, 1985'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              <span>Emergency Contact</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.emergencyContact || 'Sarah Morgan - (555) 321-9876'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Primary Hospital & Physician</span>
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.hospitalName} • {user?.primaryDoctor}</p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <Bell className="w-5 h-5 text-sky-600" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900">Email Follow-Up Reminders</p>
              <p className="text-slate-500">Receive email alerts for upcoming clinic appointments and test dates.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900">SMS Prescription Dose Notifications</p>
              <p className="text-slate-500">Get text messages when your daily medication dose is due.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={e => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900">Flagged Issue Safety Alerts</p>
              <p className="text-slate-500">Notify immediately if uploaded documents contain missing dosage details.</p>
            </div>
            <input
              type="checkbox"
              checked={medReminders}
              onChange={e => setMedReminders(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
          </label>
        </div>
      </div>

      {/* Data Privacy Information Box */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-6 text-xs space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-600" />
          <span>Data Privacy & Security Guarantee</span>
        </h3>
        <p className="text-slate-600 leading-relaxed">
          DischargeGuard uses client-side parsing and local session persistence for demo access. No actual Protected Health Information (PHI) is processed or shared. All records displayed belong to synthesized fictional test personas.
        </p>
      </div>
    </div>
  );
};
