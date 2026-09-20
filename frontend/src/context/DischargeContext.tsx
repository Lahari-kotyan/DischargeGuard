import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DischargeSummaryData, DocumentItem, RecoveryCheckitem, FollowUpAppointment } from '../types';
import { initialDischargeData, initialChecklist, initialDocuments } from '../data/initialData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface DischargeContextType {
  dischargeData: DischargeSummaryData;
  documents: DocumentItem[];
  checklist: RecoveryCheckitem[];
  activeReviewData: DischargeSummaryData | null;
  isProcessing: boolean;
  processingProgress: number;
  processingStage: string;
  toggleChecklist: (id: string) => void;
  processDocumentFile: (file: File) => Promise<DischargeSummaryData>;
  processSampleDocument: () => Promise<DischargeSummaryData>;
  resolveFlaggedIssue: (flagId: string) => void;
  toggleAppointmentReminder: (appId: string) => void;
  deleteDocument: (docId: string) => void;
  setActiveReviewData: (data: DischargeSummaryData | null) => void;
  addAppointment: (app: Omit<FollowUpAppointment, 'id'>) => void;
}

const DischargeContext = createContext<DischargeContextType | undefined>(undefined);

export const DischargeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dischargeData, setDischargeData] = useState<DischargeSummaryData>(() => {
    const saved = localStorage.getItem('dischargeguard_plan');
    return saved ? JSON.parse(saved) : initialDischargeData;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('dischargeguard_docs');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [checklist, setChecklist] = useState<RecoveryCheckitem[]>(() => {
    const saved = localStorage.getItem('dischargeguard_checklist');
    return saved ? JSON.parse(saved) : initialChecklist;
  });

  const [activeReviewData, setActiveReviewData] = useState<DischargeSummaryData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('dischargeguard_plan', JSON.stringify(dischargeData));
  }, [dischargeData]);

  useEffect(() => {
    localStorage.setItem('dischargeguard_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('dischargeguard_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const resolveFlaggedIssue = (flagId: string) => {
    const updated = {
      ...dischargeData,
      flagged_issues: dischargeData.flagged_issues.map(f => f.id === flagId ? { ...f, isResolved: true } : f)
    };
    setDischargeData(updated);

    if (activeReviewData) {
      setActiveReviewData({
        ...activeReviewData,
        flagged_issues: activeReviewData.flagged_issues.map(f => f.id === flagId ? { ...f, isResolved: true } : f)
      });
    }
  };

  const toggleAppointmentReminder = (appId: string) => {
    const updatedApps = dischargeData.follow_up_appointments.map(app => 
      app.id === appId ? { ...app, reminderSet: !app.reminderSet } : app
    );
    setDischargeData({ ...dischargeData, follow_up_appointments: updatedApps });
  };

  const addAppointment = (app: Omit<FollowUpAppointment, 'id'>) => {
    const newApp: FollowUpAppointment = {
      ...app,
      id: `app-${Date.now()}`
    };
    setDischargeData(prev => ({
      ...prev,
      follow_up_appointments: [...prev.follow_up_appointments, newApp]
    }));
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const processDocumentFile = async (file: File): Promise<DischargeSummaryData> => {
    setIsProcessing(true);
    setProcessingProgress(20);
    setProcessingStage('Uploading document to secure server...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProcessingProgress(40);
      setProcessingStage('Extracting text & running OCR analysis...');

      const endpoint = `${API_BASE_URL}/api/upload-summary`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      setProcessingProgress(75);
      setProcessingStage('Parsing clinical data & checking missing fields...');

      if (!response.ok) {
        let errorDetail = `Backend HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            errorDetail = errJson.detail;
          }
        } catch (_) {
          // Keep response status text if JSON parse fails
          errorDetail = response.statusText || errorDetail;
        }
        throw new Error(errorDetail);
      }

      const resultData: DischargeSummaryData = await response.json();
      resultData.is_demo = false;

      setProcessingProgress(100);
      setProcessingStage('Document processing completed!');
      setIsProcessing(false);

      // Add to documents library
      const newDoc: DocumentItem = {
        id: resultData.doc_id,
        name: file.name,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: resultData.flagged_issues.length > 0 ? 'Needs Review' : 'Processed',
        summaryData: resultData
      };

      setDocuments(prev => [newDoc, ...prev]);
      setActiveReviewData(resultData);
      setDischargeData(resultData);
      return resultData;

    } catch (error: any) {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStage('');
      console.error('Failed to process uploaded document:', error);
      throw error;
    }
  };

  const processSampleDocument = async (): Promise<DischargeSummaryData> => {
    setIsProcessing(true);
    setProcessingProgress(25);
    setProcessingStage('Fetching sample summary data...');

    try {
      const endpoint = `${API_BASE_URL}/api/sample-summary`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const sampleData: DischargeSummaryData = await response.json();
        sampleData.is_demo = true;
        setProcessingProgress(100);
        setIsProcessing(false);
        setActiveReviewData(sampleData);
        setDischargeData(sampleData);
        return sampleData;
      }
    } catch (_) {
      console.warn('Backend sample fetch failed, using built-in sample data.');
    }

    // Fallback sample data with clear is_demo flag
    await new Promise(res => setTimeout(res, 600));
    setProcessingProgress(100);

    const sampleDocData: DischargeSummaryData = {
      ...initialDischargeData,
      is_demo: true,
      doc_id: `DOC-SAMPLE-${Date.now().toString().slice(-4)}`,
      filename: "Sample_Discharge_Summary_Gallbladder.pdf",
      upload_timestamp: new Date().toLocaleString()
    };

    setIsProcessing(false);
    setActiveReviewData(sampleDocData);
    setDischargeData(sampleDocData);

    const newDocItem: DocumentItem = {
      id: sampleDocData.doc_id,
      name: sampleDocData.filename,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      fileSize: '1.2 MB',
      status: 'Needs Review',
      summaryData: sampleDocData
    };
    setDocuments(prev => [newDocItem, ...prev]);

    return sampleDocData;
  };

  return (
    <DischargeContext.Provider value={{
      dischargeData,
      documents,
      checklist,
      activeReviewData,
      isProcessing,
      processingProgress,
      processingStage,
      toggleChecklist,
      processDocumentFile,
      processSampleDocument,
      resolveFlaggedIssue,
      toggleAppointmentReminder,
      deleteDocument,
      setActiveReviewData,
      addAppointment
    }}>
      {children}
    </DischargeContext.Provider>
  );
};

export const useDischarge = () => {
  const context = useContext(DischargeContext);
  if (!context) {
    throw new Error('useDischarge must be used within a DischargeProvider');
  }
  return context;
};
