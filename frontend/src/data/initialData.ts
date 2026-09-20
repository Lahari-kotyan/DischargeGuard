import type { DischargeSummaryData, DocumentItem, RecoveryCheckitem, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: "Alex Morgan",
  email: "demo@dischargeguard.com",
  mrn: "MRN-8941029",
  dob: "October 14, 1985",
  emergencyContact: "Sarah Morgan (Spouse) - (555) 321-9876",
  primaryDoctor: "Dr. Robert Chen, MD",
  hospitalName: "St. Jude Metropolitan Hospital"
};

export const initialDischargeData: DischargeSummaryData = {
  doc_id: "DOC-8941029-A",
  filename: "Discharge_Summary_Gallbladder_Surgery.pdf",
  upload_timestamp: "2026-09-16 14:30:00",
  patient_visit: {
    patient_name: "Alex Morgan",
    mrn: "MRN-8941029",
    admission_date: "Sept 12, 2026",
    discharge_date: "Sept 16, 2026",
    attending_physician: "Dr. Sarah Jenkins, MD (Chief of Gastrointestinal Surgery)",
    hospital_name: "St. Jude Metropolitan Hospital",
    discharge_diagnosis: "Acute Cholecystitis - Laparoscopic Cholecystectomy (Gallbladder removal)",
    procedure: "Laparoscopic Cholecystectomy",
    summary_overview: "Patient presented with acute right upper quadrant pain. Underwent laparoscopic cholecystectomy without complication. Post-operative recovery was normal, vitals stable, and diet tolerated."
  },
  medications: [
    {
      id: "med-1",
      name: "Amoxicillin-Clavulanate (Augmentin)",
      dosage: "875 mg - 125 mg",
      route: "Oral tablet",
      frequency: "Every 12 hours with meals (8:00 AM & 8:00 PM)",
      duration: "7 days (Finish full course)",
      purpose: "Antibiotic prescribed to prevent surgical site infection.",
      special_instructions: "Take with food or a glass of milk to prevent upset stomach. Do not skip doses.",
      source_citation: "Discharge Summary - Page 2, Section: Discharge Prescriptions #1",
      needs_review: false
    },
    {
      id: "med-2",
      name: "Acetaminophen (Tylenol)",
      dosage: "500 mg",
      route: "Oral tablet",
      frequency: "Every 6 hours as needed for mild to moderate pain",
      duration: "5 to 7 days",
      purpose: "Over-the-counter pain reliever and fever reducer.",
      special_instructions: "Do not exceed 3,000 mg (6 tablets) in any 24-hour period. Check cough/cold medicines for hidden acetaminophen.",
      source_citation: "Discharge Summary - Page 2, Section: Pain Management Plan #2",
      needs_review: false
    },
    {
      id: "med-3",
      name: "Oxycodone",
      dosage: "5 mg",
      route: "Oral tablet",
      frequency: "Frequency Unclear / As needed for severe breakthrough pain",
      duration: "3 days maximum",
      purpose: "Opioid pain medication for severe post-op pain.",
      special_instructions: "May cause severe drowsiness or constipation. Do not drive or operate machinery while taking. Take only if Tylenol is insufficient.",
      source_citation: "Discharge Summary - Page 2, Section: Opioid Discharge Note #3",
      needs_review: true,
      review_reason: "Discharge paperwork omitted the exact hourly interval (e.g. q4h vs q6h). Confirm timing with physician or pharmacist."
    },
    {
      id: "med-4",
      name: "Docusate Sodium (Colace)",
      dosage: "100 mg",
      route: "Oral capsule",
      frequency: "Twice daily (Morning & Evening)",
      duration: "Until bowel habits normalize",
      purpose: "Stool softener to prevent abdominal straining while incisions heal.",
      special_instructions: "Drink a full 8 oz glass of water with each capsule.",
      source_citation: "Discharge Summary - Page 3, Section: Supportive Medications #4",
      needs_review: false
    }
  ],
  recovery_sections: [
    {
      id: "sec-visit",
      title: "What happened during your hospital visit?",
      category: "visit_summary",
      plain_text: "You were admitted to St. Jude Hospital for severe abdominal inflammation caused by gallstones. Surgeons performed a routine laparoscopic surgery (using 4 tiny abdominal keyhole cuts) to safely remove your gallbladder. Your surgery was successful with no complications.",
      medical_text: "Patient presented with acute calculous cholecystitis. Laparoscopic cholecystectomy performed under general anesthesia. Intraoperative cholangiogram normal. EBL <25ml."
    },
    {
      id: "sec-home",
      title: "What should I do at home?",
      category: "home_care",
      plain_text: "Rest as much as possible for the first 3 to 5 days. Take your antibiotics exactly on schedule until the bottle is empty. Avoid any heavy lifting or strenuous activity that puts pressure on your abdomen.",
      medical_text: "Post-op protocol: Strict adherence to oral antibiotic regimen. Rest at home. Incision care as directed."
    },
    {
      id: "sec-activity",
      title: "Activity and Rest Instructions",
      category: "activity",
      plain_text: "Walk around your home for 5-10 minutes every few hours to keep blood flowing and prevent blood clots. Do not lift objects heavier than 10 lbs (such as laundry baskets, groceries, or small children) for 2 weeks. No driving while taking Oxycodone.",
      medical_text: "Ambulation encouraged q2-3h awake. No lifting >10 lbs x 14 days. No driving while taking narcotics or until emergency stop reaction time is normal."
    },
    {
      id: "sec-diet",
      title: "Food and Hydration Instructions",
      category: "diet",
      plain_text: "Stick to low-fat, bland foods for 1 to 2 weeks (toast, plain rice, applesauce, broths, grilled chicken). Because your body no longer stores bile in a gallbladder, high-fat or greasy meals can trigger stomach cramps or loose stools. Drink 6-8 glasses of water daily.",
      medical_text: "Low-fat diet post-cholecystectomy. Reintroduce fats slowly. Maintain fluid intake >2000 mL/day."
    },
    {
      id: "sec-wound",
      title: "Wound Care & Incision Instructions",
      category: "wound_care",
      plain_text: "You have 4 small surgical incisions on your stomach closed with skin glue (Dermabond) or small tape strips. You may shower 48 hours after surgery. Gently pat the incisions dry with a clean towel. Do not soak in a bath, hot tub, or swimming pool until cleared by your surgeon.",
      medical_text: "Abdominal keyhole sites sealed with Dermabond. Shower after 48 hours allowed. No bath/pool submersion until 2-week post-op clinic visit."
    },
    {
      id: "sec-warning",
      title: "Warning Signs Requiring Urgent Medical Attention",
      category: "warning_signs",
      priority: "critical",
      plain_text: "Contact the doctor immediately or go to the nearest emergency room if you experience any of these symptoms:\n• Fever over 101.0°F (38.3°C) or chills\n• Severe abdominal pain that gets worse even after pain medicine\n• Yellowing of your skin or eyes (jaundice)\n• Persistent nausea or inability to keep liquids down\n• Redness, swelling, heat, or foul-smelling drainage from incisions",
      medical_text: "Red flag signs: Fever >101F, persistent vomiting, jaundice, increasing severe RUQ pain, purulent wound drainage."
    },
    {
      id: "sec-contact",
      title: "When to Contact the Healthcare Team",
      category: "contact_team",
      plain_text: "For non-urgent questions regarding your medications or recovery between 8:00 AM and 5:00 PM Monday-Friday, call the Surgical Outpatient Clinic at (555) 234-8900. For after-hours or weekend urgent questions, call the On-Call Triage Line at (555) 999-4321.",
      medical_text: "Surgical Clinic Hotline: (555) 234-8900. 24/7 On-Call Triage: (555) 999-4321."
    },
    {
      id: "sec-notes",
      title: "Important Discharge Notes",
      category: "notes",
      plain_text: "Pathology testing confirmed benign gallbladder inflammation. Medical leave note for 2 weeks of work absence has been issued.",
      medical_text: "Histopathology: Acute & chronic cholecystitis, negative for dysplasia. Work excuse letter provided through Sept 30."
    }
  ],
  follow_up_appointments: [
    {
      id: "app-1",
      doctor_or_dept: "Dr. Sarah Jenkins (Surgical Outpatient Clinic)",
      clinic_location: "St. Jude Outpatient Pavilion, 4th Floor, Suite 402",
      date_time: "Sept 30, 2026 at 10:30 AM",
      purpose: "2-Week Post-Operative Surgical Wound Check & Healing Evaluation.",
      instructions: "Please bring your medication bottles and any daily wound notes.",
      contact_phone: "(555) 234-8900",
      is_missing_date: false,
      reminderSet: true
    },
    {
      id: "app-2",
      doctor_or_dept: "Primary Care Physician (Dr. Robert Chen)",
      clinic_location: "Downtown Family Medicine, 108 Main Street",
      date_time: "Date Unspecified (Recommended within 3 weeks)",
      purpose: "General post-hospitalization follow-up and blood pressure check.",
      instructions: "Hospital discharge notes recommend booking this appointment soon.",
      contact_phone: "(555) 876-1234",
      is_missing_date: true,
      reminderSet: false
    }
  ],
  flagged_issues: [
    {
      id: "flag-1",
      title: "Missing Dosing Interval for Oxycodone",
      category: "medication",
      severity: "warning",
      explanation: "The discharge document listed 'Oxycodone 5mg PRN pain' without specifying how many hours to wait between doses (e.g., every 4 to 6 hours) or the maximum daily limit.",
      source_location: "Discharge Summary - Page 2, Section: Discharge Prescriptions",
      recommended_action: "Do not take doses closer than instructed. Contact your pharmacist or surgeon at (555) 234-8900 to clarify safe dosage intervals.",
      isResolved: false
    },
    {
      id: "flag-2",
      title: "Unscheduled Primary Care Follow-Up",
      category: "followup",
      severity: "action_required",
      explanation: "Your surgeon requested a follow-up with your Primary Care Doctor within 3 weeks, but no firm date or appointment time was scheduled prior to discharge.",
      source_location: "Discharge Summary - Page 3, Section: Follow-Up Care Plan",
      recommended_action: "Call Dr. Robert Chen's clinic at (555) 876-1234 to lock in a follow-up date.",
      isResolved: false
    }
  ],
  raw_text: `ST. JUDE METROPOLITAN HOSPITAL
DISCHARGE SUMMARY
Patient: Alex Morgan | MRN: 8941029 | DOB: 10/14/1985
Admit Date: 09/12/2026 | Discharge Date: 09/16/2026
Attending: Sarah Jenkins, MD - Gastrointestinal Surgery

DIAGNOSIS: Acute Cholecystitis
PROCEDURE: Laparoscopic Cholecystectomy (09/13/2026)

HOSPITAL COURSE: Patient presented with RUQ pain and gallstones on ultrasound. Laparoscopic gallbladder removal performed without complications. Vitals stable. Tolerated low-fat diet.

DISCHARGE MEDICATIONS:
1. Augmentin 875-125mg PO BID x7d
2. Tylenol 500mg PO Q6H PRN pain
3. Oxycodone 5mg PO PRN severe pain (interval missing)
4. Colace 100mg PO BID

FOLLOW UP:
- Dr. Sarah Jenkins (Surgery): 09/30/2026 @ 10:30 AM
- PCP Dr. Robert Chen: follow up within 3 weeks`
};

export const initialChecklist: RecoveryCheckitem[] = [
  { id: "chk-1", task: "Take Augmentin (Antibiotic) with breakfast", timeSlot: "Morning", category: "Medication", completed: true },
  { id: "chk-2", task: "Take Colace stool softener with 8oz water", timeSlot: "Morning", category: "Medication", completed: true },
  { id: "chk-3", task: "10-minute light walk around the living room", timeSlot: "Morning", category: "Activity", completed: true },
  { id: "chk-4", task: "Inspect abdominal incision glue for redness or swelling", timeSlot: "Afternoon", category: "Care", completed: false },
  { id: "chk-5", task: "Drink 2 glasses of water with low-fat lunch", timeSlot: "Afternoon", category: "Hydration", completed: false },
  { id: "chk-6", task: "Take evening Augmentin dose (8:00 PM)", timeSlot: "Evening", category: "Medication", completed: false },
  { id: "chk-7", task: "Check temperature before bedtime (< 101.0°F)", timeSlot: "Evening", category: "Care", completed: false }
];

export const initialDocuments: DocumentItem[] = [
  {
    id: "DOC-8941029-A",
    name: "Discharge_Summary_Gallbladder_Surgery.pdf",
    uploadDate: "Sept 16, 2026, 2:30 PM",
    fileSize: "1.4 MB",
    status: "Processed",
    summaryData: initialDischargeData
  },
  {
    id: "DOC-7721092-B",
    name: "Operative_Report_Laparoscopy.pdf",
    uploadDate: "Sept 13, 2026, 11:15 AM",
    fileSize: "890 KB",
    status: "Processed"
  },
  {
    id: "DOC-6610293-C",
    name: "Post_Op_Lab_Results_Panel.pdf",
    uploadDate: "Sept 15, 2026, 09:40 AM",
    fileSize: "450 KB",
    status: "Processed"
  }
];
