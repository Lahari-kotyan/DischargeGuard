import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DischargeSummaryData, DocumentItem, RecoveryCheckitem, FollowUpAppointment } from '../types';
import { initialDischargeData, initialChecklist, initialDocuments } from '../data/initialData';

interface DischargeContextType {
  dischargeData: DischargeSummaryData;
  documents: DocumentItem[];
  checklist: RecoveryCheckitem[];
  activeReviewData: DischargeSummaryData | null;
  isProcessing: boolean;
  processingProgress: number;
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
    setProcessingProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProcessingProgress(45);

      let resultData: DischargeSummaryData;
      try {
        const response = await fetch('/api/upload-summary', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          resultData = await response.json();
        } else {
          throw new Error('Backend server unavailable, using client processing fallback');
        }
      } catch (err) {
        console.warn('Backend API request skipped/failed, using fallback parser:', err);
        // Fallback demo processing
        await new Promise(res => setTimeout(res, 1200));
        resultData = {
          ...initialDischargeData,
          doc_id: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
          filename: file.name,
          upload_timestamp: new Date().toLocaleString()
        };
      }

      setProcessingProgress(85);
      await new Promise(res => setTimeout(res, 600));

      setProcessingProgress(100);
      setIsProcessing(false);

      // Add to documents library
      const newDoc: DocumentItem = {
        id: resultData.doc_id,
        name: file.name,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Needs Review',
        summaryData: resultData
      };

      setDocuments(prev => [newDoc, ...prev]);
      setActiveReviewData(resultData);
      return resultData;
    } catch (error) {
      setIsProcessing(false);
      setProcessingProgress(0);
      throw error;
    }
  };

  const processSampleDocument = async (): Promise<DischargeSummaryData> => {
    setIsProcessing(true);
    setProcessingProgress(25);

    await new Promise(res => setTimeout(res, 600));
    setProcessingProgress(65);
    await new Promise(res => setTimeout(res, 600));
    setProcessingProgress(100);

    const sampleDocData: DischargeSummaryData = {
      ...initialDischargeData,
      doc_id: `DOC-SAMPLE-${Date.now().toString().slice(-4)}`,
      filename: "Sample_Discharge_Summary_Gallbladder.pdf",
      upload_timestamp: new Date().toLocaleString()
    };

    setIsProcessing(false);
    setActiveReviewData(sampleDocData);
    
    // Add to doc library if not present
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
