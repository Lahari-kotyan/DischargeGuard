import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDischarge } from '../context/DischargeContext';
import { 
  ClipboardCheck, 
  User, 
  Pill, 
  FileText, 
  CalendarDays, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight
} from 'lucide-react';

export const ReviewVerifyPage: React.FC = () => {
  const { activeReviewData, dischargeData, resolveFlaggedIssue } = useDischarge();
  const navigate = useNavigate();

  // Use active review data if just uploaded, otherwise fallback to active discharge plan data
  const data = activeReviewData || dischargeData;

  const [activeTab, setActiveTab] = useState<'patient' | 'medications' | 'instructions' | 'followup' | 'alerts'>('alerts');

  const unresolvedFlags = data.flagged_issues.filter(f => !f.isResolved);

  const handleGeneratePlan = () => {
    navigate('/discharge-plan');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 mb-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Document Verification & Extraction Audit</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Review & Verify Extracted Data</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Document: <span className="font-semibold text-slate-800">{data.filename}</span> • Parsed on {data.upload_timestamp}
          </p>
        </div>

        {/* Generate Plan Action Button */}
        <button
          onClick={handleGeneratePlan}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2 group shrink-0"
        >
          <span>Generate Plain-Language Plan</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* MANDATORY Medical Disclaimer Warning Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold text-sm text-amber-950 mb-0.5">Medical Confirmation Advisory</p>
          <p>
            Please confirm flagged medical information with your healthcare professional. Do not modify or stop taking any prescribed medication without direct guidance from your doctor or pharmacist.
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`
            px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all
            ${activeTab === 'alerts' 
              ? 'bg-amber-500 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alerts & Missing Info ({unresolvedFlags.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('patient')}
          className={`
            px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all
            ${activeTab === 'patient' 
              ? 'bg-sky-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          <User className="w-4 h-4" />
          <span>Patient & Visit Details</span>
        </button>

        <button
          onClick={() => setActiveTab('medications')}
          className={`
            px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all
            ${activeTab === 'medications' 
              ? 'bg-sky-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          <Pill className="w-4 h-4" />
          <span>Medications ({data.medications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('instructions')}
          className={`
            px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all
            ${activeTab === 'instructions' 
              ? 'bg-sky-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          <FileText className="w-4 h-4" />
          <span>Recovery Instructions ({data.recovery_sections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('followup')}
          className={`
            px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all
            ${activeTab === 'followup' 
              ? 'bg-sky-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Follow-Up Details ({data.follow_up_appointments.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* TAB 1: ALERTS AND MISSING INFORMATION */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Flagged Issues & Action Items</h3>
              <p className="text-xs text-slate-500">
                Items requiring verification due to missing parameters or incomplete discharge directions.
              </p>
            </div>

            {data.flagged_issues.map((issue) => (
              <div
                key={issue.id}
                className={`
                  p-5 rounded-2xl border transition-all space-y-3
                  ${issue.isResolved 
                    ? 'bg-emerald-50/40 border-emerald-200 opacity-75' 
                    : 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-100/60'}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-xl shrink-0 mt-0.5
                      ${issue.isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}
                    `}>
                      {issue.isResolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {issue.title}
                        {issue.isResolved ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Confirmed / Resolved
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            Needs Confirmation
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Category: {issue.category.toUpperCase()}</p>
                    </div>
                  </div>

                  {!issue.isResolved && (
                    <button
                      onClick={() => resolveFlaggedIssue(issue.id)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-xl transition-colors shrink-0"
                    >
                      Mark Confirmed
                    </button>
                  )}
                </div>

                {/* 3 Explicit Points: What is missing, Where in document, What patient should do next */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200/80">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-900 block">1. What is unclear / missing:</span>
                    <p className="text-slate-700">{issue.explanation}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">2. Where found in document:</span>
                    <p className="text-slate-600 italic">{issue.source_location}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-sky-900 block">3. What you should do next:</span>
                    <p className="text-slate-800 font-medium">{issue.recommended_action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PATIENT & VISIT DETAILS */}
        {activeTab === 'patient' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Extracted Patient & Visit Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-slate-500 font-medium">Full Name</span>
                <p className="text-sm font-bold text-slate-900">{data.patient_visit.patient_name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-slate-500 font-medium">Medical Record Number (MRN)</span>
                <p className="text-sm font-bold text-slate-900">{data.patient_visit.mrn}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-slate-500 font-medium">Hospital & Facility</span>
                <p className="text-sm font-bold text-slate-900">{data.patient_visit.hospital_name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-slate-500 font-medium">Attending Physician</span>
                <p className="text-sm font-bold text-slate-900">{data.patient_visit.attending_physician}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200 md:col-span-2">
                <span className="text-slate-500 font-medium">Discharge Diagnosis & Procedure</span>
                <p className="text-sm font-bold text-slate-900">{data.patient_visit.discharge_diagnosis}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDICATIONS */}
        {activeTab === 'medications' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Extracted Prescriptions List
            </h3>
            <div className="space-y-3">
              {data.medications.map(med => (
                <div key={med.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {med.name}
                      {med.needs_review && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Needs Review
                        </span>
                      )}
                    </h4>
                    <p className="text-slate-600 mt-1">Dosage: {med.dosage} | Frequency: {med.frequency}</p>
                    <p className="text-slate-500 mt-0.5">Instructions: {med.special_instructions}</p>
                  </div>
                  <div className="text-slate-400 text-[11px] shrink-0">
                    {med.source_citation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RECOVERY INSTRUCTIONS */}
        {activeTab === 'instructions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Extracted Recovery Guidelines
            </h3>
            <div className="space-y-3 text-xs">
              {data.recovery_sections.map(sec => (
                <div key={sec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{sec.title}</h4>
                  <p className="text-slate-700 leading-relaxed">{sec.plain_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FOLLOW-UP DETAILS */}
        {activeTab === 'followup' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Extracted Follow-Up Appointments
            </h3>
            <div className="space-y-3 text-xs">
              {data.follow_up_appointments.map(app => (
                <div key={app.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{app.doctor_or_dept}</h4>
                  <p className="text-slate-800 font-semibold">{app.date_time}</p>
                  <p className="text-slate-600">{app.clinic_location}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
