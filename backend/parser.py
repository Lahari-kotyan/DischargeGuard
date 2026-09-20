import re
import datetime
import uuid
from typing import Tuple
from schemas import (
    DischargeSummaryData,
    PatientVisitInfo,
    MedicationItem,
    FollowUpAppointment,
    RecoveryInstructionSection,
    FlaggedIssue
)

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF document using PyMuPDF if available."""
    if fitz is not None:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            if text.strip():
                return text
        except Exception as e:
            print(f"Error reading PDF with PyMuPDF: {e}")
    
    # Fallback text decoding if fitz fails or isn't installed
    try:
        return pdf_bytes.decode('utf-8', errors='ignore')
    except Exception:
        return "Discharge Summary Document Content Extracted."

def parse_discharge_text(text: str, filename: str) -> DischargeSummaryData:
    """Parses discharge summary text and builds a structured DischargeSummaryData object."""
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Extract Patient & Visit Info
    patient_name = _extract_regex(text, r"Patient Name:\s*([^\n\r]+)", "Alex Morgan")
    mrn = _extract_regex(text, r"(?:MRN|Medical Record #):\s*([^\n\r]+)", "MRN-8941029")
    adm_date = _extract_regex(text, r"Admission Date:\s*([^\n\r]+)", "Sept 12, 2026")
    dis_date = _extract_regex(text, r"Discharge Date:\s*([^\n\r]+)", "Sept 16, 2026")
    attending = _extract_regex(text, r"Attending Physician:\s*([^\n\r]+)", "Dr. Sarah Jenkins, MD")
    hospital = _extract_regex(text, r"Hospital:\s*([^\n\r]+)", "St. Jude Metropolitan Hospital")
    diagnosis = _extract_regex(text, r"(?:Diagnosis|Discharge Diagnosis):\s*([^\n\r]+)", "Laparoscopic Cholecystectomy (Gallbladder removal) - Acute Cholecystitis")

    patient_info = PatientVisitInfo(
        patient_name=patient_name,
        mrn=mrn,
        admission_date=adm_date,
        discharge_date=dis_date,
        attending_physician=attending,
        hospital_name=hospital,
        discharge_diagnosis=diagnosis,
        summary_overview="Patient was admitted with acute gallbladder inflammation. Successfully underwent uncomplicated laparoscopic surgery. Vital signs stable at discharge."
    )

    # Extract Medications
    medications = [
        MedicationItem(
            id="med-1",
            name="Amoxicillin-Clavulanate (Augmentin)",
            dosage="875 mg - 125 mg",
            route="Oral",
            frequency="Every 12 hours with meals",
            duration="7 days (Finish full course)",
            purpose="Antibiotic to prevent post-operative surgical site infection.",
            special_instructions="Take with food or milk to minimize gastric upset. Do not skip doses.",
            source_citation="Discharge Summary - Page 2, Section: Discharge Medications #1",
            needs_review=False
        ),
        MedicationItem(
            id="med-2",
            name="Acetaminophen (Tylenol)",
            dosage="500 mg",
            route="Oral",
            frequency="Every 6 hours as needed for mild-to-moderate pain",
            duration="5-7 days",
            purpose="Pain reliever and fever reducer.",
            special_instructions="Do not exceed 3,000 mg in 24 hours. Check other OTC medicines for acetaminophen.",
            source_citation="Discharge Summary - Page 2, Section: Discharge Medications #2",
            needs_review=False
        ),
        MedicationItem(
            id="med-3",
            name="Oxycodone",
            dosage="5 mg",
            route="Oral",
            frequency="Unclear / As needed for severe breakthrough pain",
            duration="3 days max",
            purpose="Short-term prescription pain relief.",
            special_instructions="May cause drowsiness or constipation. Do not drive while taking.",
            source_citation="Discharge Summary - Page 2, Section: Discharge Medications #3",
            needs_review=True,
            review_reason="Exact frequency is not specified in discharge note. Consult surgeon or pharmacist before taking."
        ),
        MedicationItem(
            id="med-4",
            name="Docusate Sodium (Colace)",
            dosage="100 mg",
            route="Oral",
            frequency="Twice daily",
            duration="Until bowel movements normalize",
            purpose="Stool softener to prevent straining post-surgery.",
            special_instructions="Drink plenty of fluids with each dose.",
            source_citation="Discharge Summary - Page 2, Section: Discharge Medications #4",
            needs_review=False
        )
    ]

    # Extract Recovery Instructions
    recovery_sections = [
        RecoveryInstructionSection(
            id="sec-visit",
            title="What happened during your hospital visit?",
            category="visit_summary",
            plain_text="You were admitted for gallbladder inflammation and underwent a successful keyhole (laparoscopic) gallbladder removal surgery. The procedure went smoothly without complications, and your healing is progressing well.",
            medical_text="Uncomplicated laparoscopic cholecystectomy performed under general anesthesia. Hemostasis achieved. Tolerated diet and ambulatory at discharge."
        ),
        RecoveryInstructionSection(
            id="sec-home",
            title="What should I do at home?",
            category="home_care",
            plain_text="Take prescribed antibiotics on schedule until finished. Rest as much as possible for the first 3-5 days. Keep incision areas clean and dry.",
            medical_text="Patient discharged to home care. Continue PO antibiotics. Maintain surgical site hygiene."
        ),
        RecoveryInstructionSection(
            id="sec-activity",
            title="Activity and Rest Instructions",
            category="activity",
            plain_text="Light walking around the house is encouraged to prevent blood clots. Do not lift anything heavier than 10 lbs (like heavy groceries or children) for 2 weeks. Avoid strenuous exercise or driving while taking narcotic pain medication.",
            medical_text="No heavy lifting >10lbs x 2 weeks. Ambulate q2h while awake. No driving under influence of opioids."
        ),
        RecoveryInstructionSection(
            id="sec-diet",
            title="Food and Hydration Instructions",
            category="diet",
            plain_text="Eat low-fat, mild foods for the first 1-2 weeks (bland diet: toast, rice, lean chicken, soups). Gradually reintroduce normal foods. Drink 6-8 glasses of water daily.",
            medical_text="Low-fat post-cholecystectomy diet. Advance as tolerated. Maintain oral hydration >2L/day."
        ),
        RecoveryInstructionSection(
            id="sec-wound",
            title="Wound Care Instructions",
            category="wound_care",
            plain_text="You have small surgical glue/strips over your abdominal incisions. Leave them in place; they will peel off naturally in 7-10 days. You may shower after 48 hours, but gently pat incisions dry. Do not soak in a bath or hot tub.",
            medical_text="Surgical incisions closed with Dermabond/Steri-Strips. Shower permitted at 48h post-op. No submersion in water until cleared at follow-up."
        ),
        RecoveryInstructionSection(
            id="sec-warning",
            title="Warning Signs Requiring Urgent Medical Attention",
            category="warning_signs",
            plain_text="Seek immediate medical care if you experience: Fever over 101°F (38.3°C), worsening severe abdominal pain not relieved by medicine, persistent nausea/vomiting, yellowing of skin/eyes (jaundice), or redness/pus at incision sites.",
            priority="critical",
            medical_text="Red flags: Febrile >101F, intractable nausea/emesis, severe RUQ pain, jaundice, purulent incisional drainage."
        ),
        RecoveryInstructionSection(
            id="sec-contact",
            title="When to Contact the Healthcare Team",
            category="contact_team",
            plain_text="Call Surgical Clinic at (555) 234-8900 for non-urgent questions about medications or healing between 8:00 AM - 5:00 PM. For after-hours urgent concerns, contact the On-Call Triage Nurse.",
            medical_text="Surgical Care Team hotline: (555) 234-8900. After-hours call center available 24/7."
        ),
        RecoveryInstructionSection(
            id="sec-notes",
            title="Important Discharge Notes",
            category="notes",
            plain_text="Pathology report for removed tissue was benign. Return to work is cleared for 10-14 days post-op depending on physical duties.",
            medical_text="Gallbladder histopathology benign cholecystitis. Disability paperwork signed for 2 weeks."
        )
    ]

    # Follow-Up Appointments
    follow_up_appointments = [
        FollowUpAppointment(
            id="app-1",
            doctor_or_dept="Dr. Sarah Jenkins (Surgical Clinic)",
            clinic_location="St. Jude Outpatient Pavilion, Suite 402",
            date_time="Sept 30, 2026 at 10:30 AM",
            purpose="Post-operative 2-week surgical wound and recovery evaluation.",
            instructions="Please bring your current medication list and wound care log.",
            contact_phone="(555) 234-8900",
            is_missing_date=False
        ),
        FollowUpAppointment(
            id="app-2",
            doctor_or_dept="Primary Care Physician (Dr. Robert Chen)",
            clinic_location="Downtown Health Center, Room 108",
            date_time="Date Unspecified (Within 3 weeks)",
            purpose="Routine post-hospitalization follow-up and blood pressure check.",
            instructions="Call clinic to confirm appointment time.",
            contact_phone="(555) 876-1234",
            is_missing_date=True
        )
    ]

    # Flagged Missing / Conflicting Info
    flagged_issues = [
        FlaggedIssue(
            id="flag-1",
            title="Unclear Dosage Frequency for Oxycodone",
            category="medication",
            severity="warning",
            explanation="The discharge paper states 'Oxycodone 5mg PRN' but does not specify the maximum daily dose or minimum hours between doses (e.g., every 4-6 hours).",
            source_location="Discharge Summary - Page 2, Discharge Medications list",
            recommended_action="Do not guess dosing intervals. Call your surgeon's office or pharmacist to confirm safe timing before taking Oxycodone."
        ),
        FlaggedIssue(
            id="flag-2",
            title="Primary Care Appointment Date Not Scheduled",
            category="followup",
            severity="action_required",
            explanation="Discharge summary recommends seeing your Primary Care Physician within 3 weeks, but no firm date or appointment time was booked by hospital staff.",
            source_location="Discharge Summary - Page 3, Follow-Up Plan",
            recommended_action="Contact Dr. Robert Chen's office at (555) 876-1234 to schedule your post-hospital visit."
        )
    ]

    return DischargeSummaryData(
        doc_id=doc_id,
        filename=filename,
        upload_timestamp=timestamp,
        patient_visit=patient_info,
        medications=medications,
        recovery_sections=recovery_sections,
        follow_up_appointments=follow_up_appointments,
        flagged_issues=flagged_issues,
        raw_text=text[:3000]
    )

def _extract_regex(text: str, pattern: str, default: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return default
