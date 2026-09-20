import React, { useState } from 'react';
import { useDischarge } from '../context/DischargeContext';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  PhoneCall, 
  FileCheck, 
  AlertTriangle, 
  Bell, 
  BellCheck, 
  Plus, 
  X
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { dischargeData, toggleAppointmentReminder, addAppointment } = useDischarge();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDateTime, setNewDateTime] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleAddAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor || !newDateTime) return;

    addAppointment({
      doctor_or_dept: newDoctor,
      clinic_location: newLocation || 'Location TBD',
      date_time: newDateTime,
      purpose: newPurpose || 'Follow-Up Visit',
      instructions: 'Please bring your current medications and discharge papers.',
      contact_phone: newPhone || '(555) 000-0000',
      is_missing_date: false,
      reminderSet: true
    });

    setShowAddModal(false);
    setNewDoctor('');
    setNewDateTime('');
    setNewLocation('');
    setNewPurpose('');
    setNewPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
            <span>Post-Hospital Follow-Up Schedule</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up Appointments</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Keep track of required follow-up visits with your surgical team and primary care physician.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Appointment</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {dischargeData.follow_up_appointments.map((app) => (
          <div
            key={app.id}
            className={`
              bg-white border rounded-2xl p-6 transition-all shadow-xs space-y-4
              ${app.is_missing_date 
                ? 'border-amber-300 bg-amber-50/20 ring-2 ring-amber-100' 
                : 'border-slate-200 hover:border-slate-300'}
            `}
          >
            {/* Top Row: Date Badge & Doctor */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3.5">
                <div className={`
                  w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0
                  ${app.is_missing_date ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}
                `}>
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{app.doctor_or_dept}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      app.is_missing_date ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{app.date_time}</span>
                    </span>

                    {app.is_missing_date && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Date Unspecified in Discharge Summary</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Demo Reminder Toggle */}
              {!app.is_missing_date && (
                <button
                  onClick={() => toggleAppointmentReminder(app.id)}
                  className={`
                    px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all self-start md:self-auto
                    ${app.reminderSet 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  {app.reminderSet ? (
                    <>
                      <BellCheck className="w-4 h-4 text-emerald-600" />
                      <span>Reminder Active</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 text-slate-500" />
                      <span>Set Demo Reminder</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Missing Appointment Banner */}
            {app.is_missing_date && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Action Required: Confirm Follow-Up Date</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Your discharge summary recommends a follow-up appointment, but does not specify a booked date or time. Please contact your doctor's clinic directly.
                </p>
                <div className="pt-1">
                  <a
                    href={`tel:${app.contact_phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white font-bold rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Clinic: {app.contact_phone}</span>
                  </a>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Clinic Location:</span>
                  <span className="text-slate-600">{app.clinic_location}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Instructions & What to Bring:</span>
                  <span className="text-slate-600">{app.instructions}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add Custom Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Follow-Up Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor / Department Name</label>
                <input
                  type="text"
                  required
                  value={newDoctor}
                  onChange={e => setNewDoctor(e.target.value)}
                  placeholder="e.g. Dr. Robert Chen (Primary Care)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date and Time</label>
                <input
                  type="text"
                  required
                  value={newDateTime}
                  onChange={e => setNewDateTime(e.target.value)}
                  placeholder="e.g. Oct 05, 2026 at 2:00 PM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic Address / Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Downtown Health Center, Room 108"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  value={newPurpose}
                  onChange={e => setNewPurpose(e.target.value)}
                  placeholder="General check-up"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="(555) 876-1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
