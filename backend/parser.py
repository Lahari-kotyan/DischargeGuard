import re
import io
import uuid
import datetime
from typing import List, Tuple, Optional
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

try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

def extract_text_from_file_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text from PDF files or Image files (PNG, JPG, JPEG, TIFF, WEBP).
    Uses PyMuPDF for selectable PDF text.
    Uses PyTesseract OCR for scanned PDFs and supported images.
    """
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    # Handle PDF files
    if ext == 'pdf' or file_bytes.startswith(b'%PDF'):
        if fitz is not None:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                extracted_text = ""
                for page in doc:
                    page_text = page.get_text()
                    extracted_text += page_text + "\n"
                
                # If standard text extraction yields sufficient text, return it
                if len(extracted_text.strip()) >= 30:
                    return extracted_text.strip()
                
                # Otherwise, fallback to OCR for scanned PDF pages
                ocr_text = ""
                for page in doc:
                    pix = page.get_pixmap(dpi=150)
                    if Image and pytesseract:
                        img = Image.open(io.BytesIO(pix.tobytes("png")))
                        ocr_text += pytesseract.image_to_string(img) + "\n"
                    else:
                        break
                
                if ocr_text.strip():
                    return ocr_text.strip()
                
                if extracted_text.strip():
                    return extracted_text.strip()
                
            except Exception:
                pass

        # Fallback text decoding for text streams or pseudo-PDFs
        try:
            decoded = file_bytes.decode('utf-8', errors='ignore')
            clean_decoded = re.sub(r"^%PDF[^\n]*\n", "", decoded).strip()
            if clean_decoded:
                return clean_decoded
        except Exception:
            pass

        raise RuntimeError("No readable text could be extracted from the PDF document.")
            
    # Handle Image files
    elif ext in ['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']:
        if not Image or not pytesseract:
            raise RuntimeError("Image OCR requires Pillow and PyTesseract installed on the backend server.")
        try:
            img = Image.open(io.BytesIO(file_bytes))
            ocr_text = pytesseract.image_to_string(img)
            if not ocr_text.strip():
                raise RuntimeError("OCR process completed, but no legible text was detected in the uploaded image.")
            return ocr_text.strip()
        except Exception as e:
            if "pytesseract" in str(e).lower() or "tesseract" in str(e).lower():
                raise RuntimeError("Tesseract OCR engine is not installed or configured on the server.")
            raise RuntimeError(f"Failed to process image file: {str(e)}")
    
    else:
        try:
            text = file_bytes.decode('utf-8', errors='ignore')
            if len(text.strip()) >= 20:
                return text.strip()
        except Exception:
            pass
        raise RuntimeError(f"Unsupported file format: '.{ext}'. Please upload a PDF or high-resolution image.")


def parse_discharge_text(text: str, filename: str, is_demo: bool = False) -> DischargeSummaryData:
    """
    Parses raw discharge summary text and constructs a structured DischargeSummaryData object.
    Never falls back to hardcoded fictional patient names or demo data.
    """
    if not text or not text.strip():
        raise ValueError("No readable text was extracted.")

    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Patient & Visit Information Extraction
    patient_name = _extract_field(text, [
        r"(?:Patient\s*Full\s*Name|Patient\s*Name|Pt\s*Name|Patient)\s*:\s*(?:\r?\n|\s)*([^\n\r|;]+)",
        r"(?:Name)\s*:\s*(?:\r?\n|\s)*([^\n\r|;]+)"
    ], "Not specified")

    mrn = _extract_field(text, [
        r"(?:Medical\s*Record\s*Number|Medical\s*Record\s*#|Medical\s*Record\s*No|Patient\s*ID|Record\s*#|Chart\s*#|Account\s*#|MRN|MR\s*#)\s*:?\s*(?:\r?\n|\s)*([A-Za-z0-9\-\/]+)"
    ], "Not specified")

    adm_date = _extract_field(text, [
        r"(?:Admission\s*Date|Date\s*of\s*Admission|Admit\s*Date|Admitted\s*On|Admitted\s*Date|Admitted)\s*:?\s*(?:\r?\n|\s)*([^\n\r|;]+)"
    ], "Not specified")

    dis_date = _extract_field(text, [
        r"(?:Discharge\s*Date|Date\s*of\s*Discharge|Discharged\s*On|Discharged\s*Date|Discharged)\s*:?\s*(?:\r?\n|\s)*([^\n\r|;]+)"
    ], "Not specified")

    attending = _extract_field(text, [
        r"(?:Attending\s*Physician|Attending\s*Doctor|Attending\s*MD|Attending|Consultant|Staff\s*Physician|Provider)\s*:?\s*(?:\r?\n|\s)*([^\n\r|;]+)",
        r"(?:Doctor|Physician)\s*:?\s*(?:\r?\n|\s)*(Dr\.\s*[^\n\r|;]+)"
    ], "Not specified")

    hospital = _extract_field(text, [
        r"(?:Hospital|Facility|Medical\s*Center|Institution)\s*:\s*(?:\r?\n|\s)*([^\n\r|;]+)",
        r"^\s*([A-Z0-9\s,\.\-']+\b(?:Hospital|Medical Center|Health Center|General Hospital|Clinic)\b)"
    ], "Not specified")

    # Handle combined or individual Diagnosis and Procedure headings
    diagnosis, procedure = _extract_diagnosis_and_procedure(text)

    summary_overview = f"Patient discharge summary extracted for {patient_name}." if patient_name != "Not specified" else "Discharge summary document extracted."
    if diagnosis != "Not specified":
        summary_overview += f" Primary Diagnosis: {diagnosis}."

    patient_info = PatientVisitInfo(
        patient_name=patient_name,
        mrn=mrn,
        admission_date=adm_date,
        discharge_date=dis_date,
        attending_physician=attending,
        hospital_name=hospital,
        discharge_diagnosis=diagnosis,
        procedure=procedure,
        summary_overview=summary_overview
    )

    # 2. Dynamic Medication Parsing
    medications = _parse_medications(text)

    # 3. Dynamic Follow-up Appointment Parsing
    follow_up_appointments = _parse_followups(text)

    # 4. Dynamic Recovery Instructions Parsing
    recovery_sections = _parse_recovery_sections(text, diagnosis)

    # 5. Generate Flagged Issues based on missing info or ambiguous items
    flagged_issues: List[FlaggedIssue] = []
    
    if patient_name == "Not specified":
        flagged_issues.append(FlaggedIssue(
            id="flag-patient-name",
            title="Patient Name Not Detected",
            category="care_instruction",
            severity="warning",
            explanation="Patient name could not be automatically extracted from the document header.",
            source_location="Header Section",
            recommended_action="Verify patient identity against physical discharge notes."
        ))

    for med in medications:
        if med.needs_review:
            flagged_issues.append(FlaggedIssue(
                id=f"flag-med-{med.id}",
                title=f"Unclear Details for {med.name}",
                category="medication",
                severity="warning",
                explanation=med.review_reason or "Essential medication dosage or frequency parameters require clinical verification.",
                source_location=med.source_citation,
                recommended_action="Do not guess dosing intervals or quantities. Contact your doctor or pharmacist to confirm."
            ))

    for app in follow_up_appointments:
        if app.is_missing_date:
            flagged_issues.append(FlaggedIssue(
                id=f"flag-app-{app.id}",
                title=f"Unscheduled Follow-up with {app.doctor_or_dept}",
                category="followup",
                severity="action_required",
                explanation=f"Follow-up is recommended ({app.date_time}), but no confirmed appointment date or time was scheduled.",
                source_location="Discharge Summary - Follow-Up Section",
                recommended_action=f"Contact {app.doctor_or_dept} or call {app.contact_phone} to schedule your visit."
            ))

    return DischargeSummaryData(
        doc_id=doc_id,
        filename=filename,
        upload_timestamp=timestamp,
        is_demo=is_demo,
        patient_visit=patient_info,
        medications=medications,
        recovery_sections=recovery_sections,
        follow_up_appointments=follow_up_appointments,
        flagged_issues=flagged_issues,
        raw_text=text[:4000]
    )


KNOWN_HEADERS = [
    "PATIENT", "NAME", "MRN", "MEDICAL RECORD", "ATTENDING", "DOCTOR", "PHYSICIAN",
    "ADMISSION", "ADMITTED", "DISCHARGE", "DISCHARGED", "DIAGNOSIS", "PROCEDURE",
    "SURGERY", "HOSPITAL", "FACILITY", "CLINIC", "DOB", "DATE OF BIRTH", "AGE", "SEX",
    "GENDER", "MEDICATIONS", "FOLLOW UP", "RECOVERY", "WARNING", "IMPRESSION"
]

def _extract_field(text: str, patterns: List[str], default: str = "Not specified") -> str:
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            val = match.group(1).strip()
            # Clean trailing pipe, semicolon, or delimiter
            val = re.sub(r"\s*[|;].*$", "", val).strip()
            if not val:
                continue

            upper_val = val.upper().rstrip(':')
            if any(upper_val.startswith(h) for h in KNOWN_HEADERS) and ":" in val:
                continue

            return val
    return default


def _extract_diagnosis_and_procedure(text: str) -> Tuple[str, str]:
    """
    Safely separates Primary Diagnosis and Procedure even when combined headers
    such as 'PRIMARY DIAGNOSIS & SURGICAL PROCEDURE:' appear in the document.
    """
    diagnosis = "Not specified"
    procedure = "Not specified"

    # Check for combined heading: e.g. "PRIMARY DIAGNOSIS & SURGICAL PROCEDURE:"
    combined_match = re.search(
        r"(?:PRIMARY\s*DIAGNOSIS|DISCHARGE\s*DIAGNOSIS|DIAGNOSIS)[\s\n]*[&/\+]+\s*(?:SURGICAL\s*PROCEDURE|PROCEDURE|OPERATION)[\s:]*([^\n\r]+(?:\n[^\n\r]+)?)",
        text,
        re.IGNORECASE
    )

    if combined_match:
        content_block = combined_match.group(1).strip()
        # Check if content has diagnosis line and procedure line
        lines = [l.strip() for l in content_block.split('\n') if l.strip()]
        if len(lines) >= 2:
            diagnosis = lines[0]
            procedure = lines[1]
        elif len(lines) == 1:
            line = lines[0]
            # If line contains procedure terms (e.g. Laparoscopic Cholecystectomy / Surgery)
            if re.search(r"Cholecystectomy|Appendectomy|Surgery|Procedure|Operation|Repair|Resection", line, re.IGNORECASE):
                procedure = line
                # Try finding standalone diagnosis line above/below
            else:
                diagnosis = line

    # Standalone Diagnosis match if not populated by combined header
    if diagnosis == "Not specified":
        diag_match = re.search(
            r"(?:Discharge\s*Diagnosis|Principal\s*Diagnosis|Final\s*Diagnosis|Primary\s*Diagnosis|Admitting\s*Diagnosis|Diagnosis|Diagnoses)\s*:\s*([^\n\r]+)",
            text,
            re.IGNORECASE
        )
        if diag_match:
            val = diag_match.group(1).strip()
            # Clean if value matched heading remainder like "& SURGICAL PROCEDURE"
            val = re.sub(r"^[\s&/\+]+(?:SURGICAL\s*PROCEDURE|PROCEDURE|OPERATION):?", "", val, flags=re.IGNORECASE).strip()
            if val and not val.upper().startswith("& SURGICAL PROCEDURE"):
                diagnosis = val

    # Standalone Procedure match if not populated by combined header
    if procedure == "Not specified":
        proc_match = re.search(
            r"(?:Surgical\s*Procedure|Operative\s*Procedure|Procedure\s*Performed|Surgery\s*Performed|Procedure|Operation)\s*:\s*([^\n\r]+)",
            text,
            re.IGNORECASE
        )
        if proc_match:
            val = proc_match.group(1).strip()
            if val:
                procedure = val

    return diagnosis, procedure


def _parse_medications(text: str) -> List[MedicationItem]:
    medications: List[MedicationItem] = []
    
    med_section_match = re.search(
        r"(?:DISCHARGE\s*MEDICATIONS|MEDICATIONS\s*AT\s*DISCHARGE|DISCHARGE\s*PRESCRIPTIONS|MEDICATIONS|PRESCRIPTIONS)[\s\S]*?(?=(?:FOLLOW[\s-]*UP|RECOVERY|INSTRUCTIONS|RECOMMENDATIONS|HOSPITAL\s*COURSE|DIET|ACTIVITY|WOUND|\Z))",
        text,
        re.IGNORECASE
    )
    
    section_text = med_section_match.group(0) if med_section_match else text
    raw_lines = section_text.split('\n')

    BOGUS_MED_NAMES = {
        "DISCHARGE", "MEDICATIONS", "MEDICATION", "DOSAGE", "DOSE", "FREQUENCY",
        "DURATION", "ROUTE", "INSTRUCTIONS", "PRESCRIPTIONS", "NAME", "DRUG", "PURPOSE"
    }

    for raw_line in raw_lines:
        line_str = raw_line.strip()
        if not line_str:
            continue

        # Skip section titles & table header lines
        if re.match(r"^(?:DISCHARGE\s*MEDICATIONS|MEDICATIONS|PRESCRIPTIONS):?$", line_str, re.IGNORECASE):
            continue
            
        # Skip table column header lines e.g. "Medication | Dosage | Route | Frequency | Duration"
        if re.search(r"\b(?:medication|drug)\b.*\b(?:dosage|dose)\b.*\b(?:frequency|route)\b", line_str, re.IGNORECASE):
            continue

        # Check if line contains a real medication item
        # Match lines with bullet/number or explicit dosage numbers / PO / BID / QID
        is_med_line = (
            re.match(r"^(?:\d+[\.\)]|[\-\*•])", line_str) or 
            re.search(r"\b(?:\d+\s*(?:mg|mcg|g|ml|mg\/ml|tablet|capsule|pills?|puffs?)|PO|BID|TID|QID|PRN)\b", line_str, re.IGNORECASE)
        )
        
        if not is_med_line:
            continue

        clean_line = re.sub(r"^(?:\d+[\.\)]|[\-\*•])\s*", "", line_str).strip()
        if not clean_line:
            continue

        # If line is separated by pipes or tabs (table format)
        if '|' in clean_line:
            parts = [p.strip() for p in clean_line.split('|') if p.strip()]
            if len(parts) >= 2:
                name_part = parts[0]
                dosage = parts[1] if len(parts) > 1 else "Not specified"
                route = parts[2] if len(parts) > 2 else "Oral"
                frequency = parts[3] if len(parts) > 3 else "Not specified"
                duration = parts[4] if len(parts) > 4 else "As directed"
            else:
                name_part = clean_line
                dosage, route, frequency, duration = "Not specified", "Oral", "Not specified", "As directed"
        else:
            dose_match = re.search(r"(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*(?:mg|mcg|g|ml|mg\/ml|tablet|capsule|pills?|puffs?))", clean_line, re.IGNORECASE)
            dosage = dose_match.group(1).strip() if dose_match else "Not specified"

            if dose_match:
                name_part = clean_line[:dose_match.start()].strip()
                if not name_part:
                    name_part = clean_line.split()[0]
            else:
                name_part = clean_line.split()[0] if clean_line else clean_line

            route_match = re.search(r"\b(PO|oral|topical|sublingual|IV|intramuscular|subcutaneous|inhalation)\b", clean_line, re.IGNORECASE)
            route = route_match.group(1).upper() if route_match else ("Oral" if "PO" in clean_line.upper() or "tablet" in clean_line.lower() or "capsule" in clean_line.lower() else "Not specified")
            if route == "PO":
                route = "Oral"

            freq_match = re.search(r"\b(BID|TID|QID|QD|q\d+h|every\s+\d+\s+hours|once\s+daily|twice\s+daily|three\s+times\s+daily|four\s+times\s+daily|as\s+needed|PRN(?:[^\n,]*))\b", clean_line, re.IGNORECASE)
            frequency = freq_match.group(1).strip() if freq_match else "Not specified"

            dur_match = re.search(r"\b(x\s*\d+\s*days?|\d+\s*days?|for\s*\d+\s*weeks?|until\s+finished)\b", clean_line, re.IGNORECASE)
            duration = dur_match.group(1).strip() if dur_match else "As directed"

        # Clean name part
        name_part = re.sub(r"[\(\):,]", " ", name_part).strip()
        
        # Check if bogus medication name
        if name_part.upper() in BOGUS_MED_NAMES or not name_part:
            continue

        needs_review = False
        review_reason = None

        if frequency == "Not specified" or "frequency missing" in clean_line.lower() or "interval missing" in clean_line.lower() or "unclear" in clean_line.lower():
            needs_review = True
            review_reason = "Specific dosing frequency or interval is missing in the document. Please verify timing with your doctor or pharmacist."
        elif "PRN" in frequency.upper() and not re.search(r"q\d+h|every\s+\d+", clean_line, re.IGNORECASE):
            needs_review = True
            review_reason = "Prescribed 'as needed' (PRN) without explicit hourly dosing limits. Consult physician/pharmacist for maximum safe dosage."
        elif dosage == "Not specified":
            needs_review = True
            review_reason = "Specific medication dosage is missing in the source text. Confirm exact dose before taking."

        medications.append(MedicationItem(
            id=f"med-{len(medications)+1}",
            name=name_part,
            dosage=dosage,
            route=route,
            frequency=frequency,
            duration=duration,
            purpose="Prescribed medication as specified in discharge summary.",
            special_instructions=clean_line,
            source_citation=f"Discharge Summary - Medication Entry #{len(medications)+1}",
            needs_review=needs_review,
            review_reason=review_reason
        ))

    return medications


def _parse_followups(text: str) -> List[FollowUpAppointment]:
    appointments: List[FollowUpAppointment] = []
    seen_keys = set()

    followup_match = re.search(
        r"(?:FOLLOW[\s-]*UP|OUTPATIENT\s*CARE|APPOINTMENTS|RECOVERY\s*PLAN)[\s\S]*?(?=(?:RECOVERY|INSTRUCTIONS|MEDICATIONS|WARNING|\Z))",
        text,
        re.IGNORECASE
    )

    if not followup_match:
        return []

    section_text = followup_match.group(0)
    raw_lines = [l.strip() for l in section_text.split('\n') if l.strip() and not re.match(r"^FOLLOW[\s-]*UP:?$", l.strip(), re.IGNORECASE)]

    for line in raw_lines:
        line_str = line.strip()
        if re.match(r"^(?:FOLLOW[\s-]*UP(?:\s*APPOINTMENTS)?|APPOINTMENTS|OUTPATIENT\s*CARE):?$", line_str, re.IGNORECASE):
            continue

        if not re.search(r"doctor|dr\.|clinic|hospital|PCP|surgeon|follow|within|\d{1,2}/\d{1,2}|\d+\s*days|weeks", line_str, re.IGNORECASE):
            continue

        clean_line = re.sub(r"^(?:\d+[\.\)]|[\-\*•])\s*", "", line).strip()
        if not clean_line or len(clean_line) < 6:
            continue

        doc_match = re.search(r"(?:Dr\.\s*[\w\s]+|PCP|Surgical\s*Clinic|Outpatient\s*Clinic|Physician|Specialist)", clean_line, re.IGNORECASE)
        doc_or_dept = doc_match.group(0).strip() if doc_match else "Healthcare Provider"

        date_match = re.search(r"(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?(?:\s*@\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)?|\b\d{1,2}/\d{1,2}/\d{2,4})", clean_line, re.IGNORECASE)
        
        is_missing_date = False
        if date_match:
            date_time = date_match.group(1).strip()
        else:
            rec_match = re.search(r"(within\s+\d+[\-\s\d]*\s*(?:days|weeks)|recommended\s+in\s+\d+\s*weeks)", clean_line, re.IGNORECASE)
            if rec_match:
                date_time = f"Date Unspecified ({rec_match.group(1).strip()})"
                is_missing_date = True
            else:
                date_time = "Date Unspecified"
                is_missing_date = True

        phone_match = re.search(r"(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})", clean_line)
        phone = phone_match.group(1).strip() if phone_match else "Not specified"

        dedup_key = f"{doc_or_dept.lower()}_{date_time.lower()}_{clean_line.lower()}"
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        appointments.append(FollowUpAppointment(
            id=f"app-{len(appointments)+1}",
            doctor_or_dept=doc_or_dept,
            clinic_location="Refer to clinic/discharge instructions",
            date_time=date_time,
            purpose="Post-discharge evaluation and follow-up care.",
            instructions=clean_line,
            contact_phone=phone,
            is_missing_date=is_missing_date
        ))

    return appointments


def _parse_recovery_sections(text: str, diagnosis: str) -> List[RecoveryInstructionSection]:
    sections: List[RecoveryInstructionSection] = []

    # 1. Visit Summary Section
    visit_summary_match = re.search(r"(?:HOSPITAL\s*COURSE|VISIT\s*SUMMARY|SUMMARY)[\s:]*([^\n\r\.\?!]+(?:\.[^\n\r]+){0,3})", text, re.IGNORECASE)
    med_visit = visit_summary_match.group(0).strip() if visit_summary_match else f"Discharge summary record for diagnosis: {diagnosis}."
    plain_visit = f"You were treated in the hospital for {diagnosis if diagnosis != 'Not specified' else 'your condition'}. Your care team completed your initial evaluation and stabilized your recovery prior to discharge."

    sections.append(RecoveryInstructionSection(
        id="sec-visit",
        title="What happened during your hospital visit?",
        category="visit_summary",
        plain_text=plain_visit,
        medical_text=med_visit,
        priority="normal"
    ))

    # 2. Extract Diet / Food & Hydration Instructions from Document
    diet_match = re.search(r"(?:DIET|NUTRITION|FOOD[\s\n]*AND[\s\n]*HYDRATION)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})", text, re.IGNORECASE)
    if diet_match:
        diet_text = diet_match.group(1).strip()
        sections.append(RecoveryInstructionSection(
            id="sec-diet",
            title="Food and Hydration Instructions",
            category="diet",
            plain_text=f"Follow document instructions: {diet_text}",
            medical_text=diet_text,
            priority="normal"
        ))

    # 3. Extract Activity & Rest Instructions from Document
    activity_match = re.search(r"(?:ACTIVITY|EXERCISE|REST|PHYSICAL[\s\n]*RESTRICTIONS)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})", text, re.IGNORECASE)
    if activity_match:
        act_text = activity_match.group(1).strip()
        sections.append(RecoveryInstructionSection(
            id="sec-activity",
            title="Activity and Rest Instructions",
            category="activity",
            plain_text=f"Follow activity instructions: {act_text}",
            medical_text=act_text,
            priority="normal"
        ))

    # 4. Extract Wound Care Instructions from Document
    wound_match = re.search(r"(?:WOUND[\s\n]*CARE|INCISION[\s\n]*CARE|DRESSING)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})", text, re.IGNORECASE)
    if wound_match:
        wnd_text = wound_match.group(1).strip()
        sections.append(RecoveryInstructionSection(
            id="sec-wound",
            title="Wound Care Instructions",
            category="wound_care",
            plain_text=f"Wound care directions: {wnd_text}",
            medical_text=wnd_text,
            priority="normal"
        ))

    # 5. Extract Warning Signs from Document
    warning_match = re.search(r"(?:WARNING\s*SIGNS|RED\s*FLAGS|WHEN\s*TO\s*SEEK\s*CARE|EMERGENCY)[\s:]*([^\n\r]+(?:\n[^\n\r]+){0,2})", text, re.IGNORECASE)
    med_warning = warning_match.group(1).strip() if warning_match else "Fever > 101°F, severe unrelieved pain, difficulty breathing, or unexpected bleeding."
    plain_warning = f"Seek immediate medical attention if you experience: {med_warning}"

    sections.append(RecoveryInstructionSection(
        id="sec-warning",
        title="Warning Signs Requiring Urgent Medical Attention",
        category="warning_signs",
        plain_text=plain_warning,
        medical_text=med_warning,
        priority="critical"
    ))

    # 6. Contact Information
    sections.append(RecoveryInstructionSection(
        id="sec-contact",
        title="When to Contact the Healthcare Team",
        category="contact_team",
        plain_text="Contact your doctor's office or clinic for non-urgent questions about your healing, prescription refills, or appointment scheduling.",
        medical_text="Outpatient care support: Contact attending physician's office for post-discharge inquiries.",
        priority="normal"
    ))

    return sections
