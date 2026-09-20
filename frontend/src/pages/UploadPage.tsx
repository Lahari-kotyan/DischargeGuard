import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDischarge } from '../context/DischargeContext';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  FileType
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { processDocumentFile, processSampleDocument, isProcessing, processingProgress } = useDischarge();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg('');
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setErrorMsg('Unsupported file format. Please upload a PDF or image file (JPEG, PNG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds 15 MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleProcessSubmit = async () => {
    if (!selectedFile) return;
    try {
      await processDocumentFile(selectedFile);
      navigate('/review');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process document.');
    }
  };

  const handleProcessSample = async () => {
    try {
      await processSampleDocument();
      navigate('/review');
    } catch (err: any) {
      setErrorMsg('Sample processing failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
          <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
          <span>Document Extraction Pipeline</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Discharge Summary</h2>
        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
          Upload your hospital discharge paper or surgical summary (PDF or scanned image). Our system parses complex clinical text into plain language instructions, medications, and follow-up schedules.
        </p>
      </div>

      {/* Quick Sample Document Preset Banner */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Want to test without uploading your own PDF?</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Use our realistic pre-configured hospital discharge summary sample.
            </p>
          </div>
        </div>
        <button
          onClick={handleProcessSample}
          disabled={isProcessing}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Sample...</span>
            </>
          ) : (
            <>
              <FileType className="w-4 h-4" />
              <span>Process Sample Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Main Drag and Drop Upload Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Error Message Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-3
            ${dragActive 
              ? 'border-sky-500 bg-sky-50/80 scale-[0.99]' 
              : selectedFile 
                ? 'border-emerald-400 bg-emerald-50/30' 
                : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">{selectedFile.name}</h4>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'PDF Document'}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>File Ready to Process</span>
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Drag & drop your discharge document here
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF or high-resolution photo/scan (JPG, PNG) up to 15 MB
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Browse Local Files
              </button>
            </div>
          )}
        </div>

        {/* Instructions & Guidelines Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
          <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Document Guidelines for Best Extraction</span>
          </h5>
          <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
            <li>Upload official hospital discharge paperwork containing doctor's notes, prescriptions, and follow-up plans.</li>
            <li>Ensure text in photos/scans is clearly legible and unblurred.</li>
            <li>Document processing operates locally within the demo environment. No real health records leave your browser.</li>
          </ul>
        </div>

        {/* Processing State Progress Bar */}
        {isProcessing && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Processing Document & Extracting Medical Data...</span>
              </span>
              <span>{processingProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-sky-200/70 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Process Document Submit Button */}
        {selectedFile && !isProcessing && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleProcessSubmit}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Process Document & Review Extracted Information</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
