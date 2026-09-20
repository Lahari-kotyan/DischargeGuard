import React, { useState } from 'react';
import { useDischarge } from '../context/DischargeContext';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  FileText, 
  PhoneCall, 
  Activity, 
  Utensils, 
  Bandage, 
  Home, 
  Sparkles,
  X,
  Printer
} from 'lucide-react';

export const DischargePlanPage: React.FC = () => {
  const { dischargeData } = useDischarge();

  // Accordion state: all expanded by default or toggleable
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-visit': true,
    'sec-home': true,
    'sec-activity': true,
    'sec-diet': true,
    'sec-wound': true,
    'sec-warning': true,
    'sec-contact': true,
    'sec-notes': true,
  });

  const [showOriginalModal, setShowOriginalModal] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    dischargeData.recovery_sections.forEach(s => { allExpanded[s.id] = true; });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visit_summary': return <FileText className="w-5 h-5 text-sky-600" />;
      case 'home_care': return <Home className="w-5 h-5 text-sky-600" />;
      case 'activity': return <Activity className="w-5 h-5 text-emerald-600" />;
      case 'diet': return <Utensils className="w-5 h-5 text-amber-600" />;
      case 'wound_care': return <Bandage className="w-5 h-5 text-indigo-600" />;
      case 'warning_signs': return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'contact_team': return <PhoneCall className="w-5 h-5 text-sky-600" />;
      default: return <Sparkles className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Plain-Language Translated Recovery Plan</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Discharge Plan</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Hospital: {dischargeData.patient_visit.hospital_name} • Attending: {dischargeData.patient_visit.attending_physician}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowOriginalModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>View Original Document</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Plan</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button onClick={expandAll} className="px-2.5 py-1 text-slate-700 hover:bg-white rounded-lg transition-colors">
              Expand All
            </button>
            <button onClick={collapseAll} className="px-2.5 py-1 text-slate-700 hover:bg-white rounded-lg transition-colors">
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Patient Visit Info Overview Box */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Patient Name</span>
          <p className="font-bold text-slate-900 text-sm">{dischargeData.patient_visit.patient_name}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">MRN Number</span>
          <p className="font-bold text-slate-900 text-sm">{dischargeData.patient_visit.mrn}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Admission & Discharge</span>
          <p className="font-bold text-slate-900 text-sm">
            {dischargeData.patient_visit.admission_date} – {dischargeData.patient_visit.discharge_date}
          </p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Primary Diagnosis</span>
          <p className="font-bold text-slate-900 text-sm">{dischargeData.patient_visit.discharge_diagnosis}</p>
        </div>
      </div>

      {/* Discharge Plan Sections List */}
      <div className="space-y-4">
        {dischargeData.recovery_sections.map((section) => {
          const isExpanded = expandedSections[section.id] !== false;
          const isCritical = section.category === 'warning_signs';

          return (
            <div
              key={section.id}
              className={`
                bg-white border rounded-2xl overflow-hidden transition-all duration-200 shadow-xs
                ${isCritical 
                  ? 'border-rose-300 ring-2 ring-rose-100' 
                  : 'border-slate-200 hover:border-slate-300'}
              `}
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`
                  w-full px-6 py-4 flex items-center justify-between text-left transition-colors
                  ${isCritical ? 'bg-rose-50/80 hover:bg-rose-100/60' : 'bg-white hover:bg-slate-50/70'}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`
                    p-2 rounded-xl shrink-0
                    ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}
                  `}>
                    {getCategoryIcon(section.category)}
                  </div>
                  <div>
                    <h3 className={`font-bold text-base tracking-tight ${isCritical ? 'text-rose-900' : 'text-slate-900'}`}>
                      {section.title}
                    </h3>
                    {isCritical && (
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                        Urgent Attention Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    {isExpanded ? 'Hide' : 'Show Details'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className={`w-5 h-5 ${isCritical ? 'text-rose-700' : 'text-slate-400'}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 ${isCritical ? 'text-rose-700' : 'text-slate-400'}`} />
                  )}
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className={`p-6 pt-2 border-t ${isCritical ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-white'}`}>
                  
                  {/* Plain Language Instruction */}
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                      {section.plain_text}
                    </div>

                    {/* Medical Original Text Drawer */}
                    {section.medical_text && (
                      <div className="mt-4 pt-3 border-t border-slate-100/80">
                        <details className="group">
                          <summary className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer inline-flex items-center gap-1 select-none">
                            <span>Compare with original clinical discharge text</span>
                          </summary>
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 leading-relaxed">
                            <span className="font-sans font-semibold text-slate-500 block mb-1">Source Hospital Text:</span>
                            "{section.medical_text}"
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: View Original Discharge Summary Text */}
      {showOriginalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Original Hospital Discharge Summary</h3>
              </div>
              <button
                onClick={() => setShowOriginalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 leading-relaxed bg-slate-900 text-slate-100 rounded-b-2xl">
              <pre className="whitespace-pre-wrap font-mono">{dischargeData.raw_text}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setShowOriginalModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800"
              >
                Close Summary View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
