import React, { useState } from 'react';
import { useDischarge } from '../context/DischargeContext';
import { Pill, AlertTriangle, ShieldCheck, FileText, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import type { MedicationItem } from '../types';

export const MedicationsPage: React.FC = () => {
  const { dischargeData } = useDischarge();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);

  const filteredMeds = dischargeData.medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReview = filterNeedsReview ? med.needs_review : true;
    return matchesSearch && matchesReview;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
            <Pill className="w-3.5 h-3.5 text-sky-600" />
            <span>Prescription & Over-the-Counter Schedule</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Discharge Medications</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Organized medication list extracted from your discharge document.
          </p>
        </div>

        {/* Safety Disclaimer Badge */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl max-w-sm text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Patient Safety Advisory</span>
          </p>
          <p>
            Do not alter doses or schedules. Confirm any unclear instructions directly with your doctor or pharmacist.
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medication name or purpose..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterNeedsReview}
              onChange={(e) => setFilterNeedsReview(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
            />
            <span>Show Only "Needs Review" ({dischargeData.medications.filter(m => m.needs_review).length})</span>
          </label>
        </div>
      </div>

      {/* Medication Cards List */}
      <div className="space-y-4">
        {filteredMeds.map((med: MedicationItem) => (
          <div
            key={med.id}
            className={`
              bg-white border rounded-2xl p-6 transition-all shadow-xs space-y-4
              ${med.needs_review 
                ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20' 
                : 'border-slate-200 hover:border-slate-300'}
            `}
          >
            {/* Top Row: Name, Status Badge, Purpose */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5
                  ${med.needs_review ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}
                `}>
                  Rx
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">{med.name}</h3>
                    {med.needs_review ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Needs Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Instructions</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-700">Purpose:</span> {med.purpose}
                  </p>
                </div>
              </div>
            </div>

            {/* Needs Review Alert Banner */}
            {med.needs_review && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Missing / Unclear Information Flagged</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  {med.review_reason}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <a
                    href="tel:5552348900"
                    className="font-bold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
                  >
                    <span>Call Pharmacy / Doctor to Confirm</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Medication Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Prescribed Dosage</span>
                <span className="font-bold text-slate-900 text-sm">{med.dosage}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Administration Route</span>
                <span className="font-semibold text-slate-900">{med.route}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Frequency & Timing</span>
                <span className="font-semibold text-slate-900">{med.frequency}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Duration</span>
                <span className="font-semibold text-slate-900">{med.duration}</span>
              </div>
            </div>

            {/* Special Instructions & Document Citation */}
            <div className="space-y-2 text-xs">
              <div className="bg-sky-50/40 p-3 rounded-xl border border-sky-100/60">
                <span className="font-bold text-slate-800 block mb-0.5">Special Instructions:</span>
                <p className="text-slate-700">{med.special_instructions}</p>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                <span>Source Citation: {med.source_citation}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredMeds.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No medications found matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
