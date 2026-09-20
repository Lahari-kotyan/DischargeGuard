import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDischarge } from '../context/DischargeContext';
import { 
  FileText, 
  UploadCloud, 
  CalendarDays, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { dischargeData, checklist, toggleChecklist } = useDischarge();
  const navigate = useNavigate();

  const unresolvedFlags = dischargeData.flagged_issues.filter(f => !f.isResolved);
  const nextAppointment = dischargeData.follow_up_appointments.find(a => !a.is_missing_date) || dischargeData.follow_up_appointments[0];

  const completedCount = checklist.filter(c => c.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1">
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Gallbladder Surgery Recovery • Day 3 of 14</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name.split(' ')[0] || 'Alex'}.
          </h2>
          <p className="text-slate-600 text-sm">
            Here is your daily recovery summary. Follow your care guidelines and confirm any flagged notes.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/discharge-plan')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2 group"
          >
            <FileText className="w-4 h-4" />
            <span>View My Discharge Plan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>Upload Discharge Summary</span>
          </button>
        </div>
      </div>

      {/* 2. Important Alerts Notification Bar (if any flags exist) */}
      {unresolvedFlags.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {unresolvedFlags.length} Discharge Note Item Requires Confirmation
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {unresolvedFlags[0].title} — {unresolvedFlags[0].explanation}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/review')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg shrink-0 transition-colors"
          >
            Review Item
          </button>
        </div>
      )}

      {/* 3. Two-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3): Recovery Status & Today's Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recovery Progress Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Recovery Status Overview</h3>
                  <p className="text-xs text-slate-500">Post-Laparoscopic Cholecystectomy Progress</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {progressPercent}% Today's Tasks Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                <span>Day 1 (Discharge)</span>
                <span className="font-bold text-slate-900">Today (Day 3)</span>
                <span>Day 14 (Full Recovery)</span>
              </div>
            </div>
          </div>

          {/* Today's Recovery Checklist Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Today's Recovery Checklist</h3>
                  <p className="text-xs text-slate-500">Essential daily care steps and medication times</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {completedCount} of {checklist.length} done
              </span>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`
                    flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none
                    ${item.completed 
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-slate-500' 
                      : 'bg-white border-slate-200 hover:border-sky-300 text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-5 h-5 rounded-md flex items-center justify-center transition-colors
                      ${item.completed ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 bg-white'}
                    `}>
                      {item.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <span className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.task}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.timeSlot}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button 
                onClick={() => navigate('/discharge-plan')}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
              >
                <span>View Full Care Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (1/3): Upcoming Appointment & Quick Actions */}
        <div className="space-y-6">

          {/* Next Follow-Up Appointment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Next Appointment</h3>
                <p className="text-xs text-slate-500">Upcoming follow-up visit</p>
              </div>
            </div>

            {nextAppointment ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                    <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{nextAppointment.date_time}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{nextAppointment.doctor_or_dept}</p>
                  <p className="text-xs text-slate-600">{nextAppointment.clinic_location}</p>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Instructions:</span> {nextAppointment.instructions}
                </div>

                <button
                  onClick={() => navigate('/appointments')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Manage All Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No upcoming appointments found.
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Quick Links</h3>
            
            <button
              onClick={() => navigate('/medications')}
              className="w-full p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-xl flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  Rx
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Medication Schedule</p>
                  <p className="text-[11px] text-slate-500">{dischargeData.medications.length} Prescriptions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/documents')}
              className="w-full p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-xl flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">My Document Library</p>
                  <p className="text-[11px] text-slate-500">View hospital files</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
