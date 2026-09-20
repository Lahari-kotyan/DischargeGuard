from pydantic import BaseModel
from typing import List, Optional

class PatientVisitInfo(BaseModel):
    patient_name: str
    mrn: str
    admission_date: str
    discharge_date: str
    attending_physician: str
    hospital_name: str
    discharge_diagnosis: str
    summary_overview: str

class MedicationItem(BaseModel):
    id: str
    name: str
    dosage: str
    route: str
    frequency: str
    duration: str
    purpose: str
    special_instructions: str
    source_citation: str
    needs_review: bool = False
    review_reason: Optional[str] = None

class FollowUpAppointment(BaseModel):
    id: str
    doctor_or_dept: str
    clinic_location: str
    date_time: str
    purpose: str
    instructions: str
    contact_phone: str
    is_missing_date: bool = False

class RecoveryInstructionSection(BaseModel):
    id: str
    title: str
    category: str # 'visit_summary', 'home_care', 'activity', 'diet', 'wound_care', 'warning_signs', 'contact_team', 'notes'
    plain_text: str
    medical_text: Optional[str] = None
    priority: str = "normal" # 'normal', 'high', 'critical'

class FlaggedIssue(BaseModel):
    id: str
    title: str
    category: str # 'medication', 'followup', 'care_instruction'
    severity: str # 'warning', 'action_required'
    explanation: str
    source_location: str
    recommended_action: str

class DischargeSummaryData(BaseModel):
    doc_id: str
    filename: str
    upload_timestamp: str
    patient_visit: PatientVisitInfo
    medications: List[MedicationItem]
    recovery_sections: List[RecoveryInstructionSection]
    follow_up_appointments: List[FollowUpAppointment]
    flagged_issues: List[FlaggedIssue]
    raw_text: str
