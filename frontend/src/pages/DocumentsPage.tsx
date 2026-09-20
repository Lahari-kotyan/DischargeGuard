import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDischarge } from '../context/DischargeContext';
import { 
  FolderArchive, 
  FileText, 
  Trash2, 
  Eye, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  X
} from 'lucide-react';
import type { DocumentItem } from '../types';

export const DocumentsPage: React.FC = () => {
  const { documents, deleteDocument, setActiveReviewData } = useDischarge();
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDocModal, setViewDocModal] = useState<DocumentItem | null>(null);

  const confirmDelete = () => {
    if (deleteId) {
      deleteDocument(deleteId);
      setDeleteId(null);
    }
  };

  const handleViewDocument = (doc: DocumentItem) => {
    if (doc.summaryData) {
      setActiveReviewData(doc.summaryData);
      navigate('/review');
    } else {
      setViewDocModal(doc);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-100 mb-1.5">
            <FolderArchive className="w-3.5 h-3.5 text-sky-600" />
            <span>Encrypted Hospital Document Library</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Documents</h2>
          <p className="text-slate-600 text-sm mt-0.5">
            Store and view uploaded discharge summaries, surgical reports, and lab results.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-sky-200 flex items-center justify-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Summary</span>
        </button>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Stored Documents ({documents.length})</h3>
          <span className="text-xs text-slate-500 font-medium">Fictional Demo Repository</span>
        </div>

        {documents.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>Uploaded {doc.uploadDate}</span>
                      <span>•</span>
                      <span>Size: {doc.fileSize}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        doc.status === 'Processed' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {doc.status === 'Processed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{doc.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Extracted Details</span>
                  </button>

                  <button
                    onClick={() => setDeleteId(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            No documents stored yet. Click "Upload New Summary" above to add one.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Document?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to remove this discharge summary from your document library? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Raw Modal */}
      {viewDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">{viewDocModal.name}</h3>
              <button onClick={() => setViewDocModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-2 font-mono">
              <p>Document ID: {viewDocModal.id}</p>
              <p>Uploaded: {viewDocModal.uploadDate}</p>
              <p>Status: {viewDocModal.status}</p>
              <p>File Size: {viewDocModal.fileSize}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewDocModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
