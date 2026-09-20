export interface UserProfile {
  name: string;
  email: string;
  mrn: string;
  dob: string;
  emergencyContact: string;
  primaryDoctor: string;
  hospitalName: string;
}

export interface PatientVisitInfo {
  patient_name: string;
  mrn: string;
  admission_date: string;
  discharge_date: string;
  attending_physician: string;
  hospital_name: string;
  discharge_diagnosis: string;
  summary_overview: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  purpose: string;
  special_instructions: string;
  source_citation: string;
  needs_review: boolean;
  review_reason?: string;
  takenToday?: boolean;
}

export interface FollowUpAppointment {
  id: string;
  doctor_or_dept: string;
  clinic_location: string;
  date_time: string;
  purpose: string;
  instructions: string;
  contact_phone: string;
  is_missing_date: boolean;
  reminderSet?: boolean;
}

export interface RecoveryInstructionSection {
  id: string;
  title: string;
  category: 'visit_summary' | 'home_care' | 'activity' | 'diet' | 'wound_care' | 'warning_signs' | 'contact_team' | 'notes';
  plain_text: string;
  medical_text?: string;
  priority?: 'normal' | 'high' | 'critical';
}

export interface FlaggedIssue {
  id: string;
  title: string;
  category: 'medication' | 'followup' | 'care_instruction';
  severity: 'warning' | 'action_required';
  explanation: string;
  source_location: string;
  recommended_action: string;
  isResolved?: boolean;
}

export interface DischargeSummaryData {
  doc_id: string;
  filename: string;
  upload_timestamp: string;
  patient_visit: PatientVisitInfo;
  medications: MedicationItem[];
  recovery_sections: RecoveryInstructionSection[];
  follow_up_appointments: FollowUpAppointment[];
  flagged_issues: FlaggedIssue[];
  raw_text: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  uploadDate: string;
  fileSize: string;
  status: 'Processed' | 'Needs Review' | 'Processing';
  summaryData?: DischargeSummaryData;
}

export interface RecoveryCheckitem {
  id: string;
  task: string;
  timeSlot: string;
  category: 'Medication' | 'Care' | 'Activity' | 'Hydration';
  completed: boolean;
}
