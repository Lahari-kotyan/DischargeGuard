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
    Never falls back to hardcoded fictional patient names (e.g. Alex Morgan).
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

    diagnosis = _extract_field(text, [
        r"(?:Discharge\s*Diagnosis|Principal\s*Diagnosis|Final\s*Diagnosis|Primary\s*Diagnosis|Admitting\s*Diagnosis|Diagnosis|Diagnoses|Fictional\s*diagnosis)\s*:?\s*(?:\r?\n|\s)*([^\n\r]+)",
        r"(?:Impression|Assessment)\s*:?\s*(?:\r?\n|\s)*([^\n\r]+)"
    ], "Not specified")

    procedure = _extract_field(text, [
        r"(?:Surgical\s*Procedure|Operative\s*Procedure|Procedure\s*Performed|Surgery\s*Performed|Procedure|Operation)\s*:?\s*(?:\r?\n|\s)*([^\n\r]+)"
    ], "Not specified")

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

            # Check if extracted value is actually another header label
            upper_val = val.upper().rstrip(':')
            if any(upper_val.startswith(h) for h in KNOWN_HEADERS) and ":" in val:
                continue

            return val
    return default


def _parse_medications(text: str) -> List[MedicationItem]:
    medications: List[MedicationItem] = []

    med_section_match = re.search(
        r"(?:DISCHARGE\s*MEDICATIONS|MEDICATIONS\s*AT\s*DISCHARGE|MEDICATIONS|DISCHARGE\s*PRESCRIPTIONS|PRESCRIPTIONS)[\s\S]*?(?=(?:FOLLOW[\s-]*UP|RECOVERY|INSTRUCTIONS|RECOMMENDATIONS|HOSPITAL\s*COURSE|\Z))",
        text,
        re.IGNORECASE
    )

    section_text = med_section_match.group(0) if med_section_match else text

    raw_lines = section_text.split('\n')
    med_lines = []
    for line in raw_lines:
        line_str = line.strip()
        if not line_str:
            continue
        if re.match(r"^(?:DISCHARGE\s*MEDICATIONS|MEDICATIONS|PRESCRIPTIONS):?$", line_str, re.IGNORECASE):
            continue
        if re.match(r"^(?:\d+[\.\)]|[\-\*â€¢])", line_str) or re.search(r"\b(?:\d+\s*(?:mg|mcg|g|ml|tablet|capsule|pills?)|PO|BID|TID|QID|PRN)\b", line_str, re.IGNORECASE):
            med_lines.append(line_str)

    if not med_lines and med_section_match:
        med_lines = [l.strip() for l in section_text.split('\n') if len(l.strip()) > 5 and not l.strip().endswith(':')]

    for idx, raw_line in enumerate(med_lines, start=1):
        clean_line = re.sub(r"^(?:\d+[\.\)]|[\-\*â€¢])\s*", "", raw_line).strip()
        if not clean_line:
            continue

        dose_match = re.search(r"(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?\s*(?:mg|mcg|g|ml|mg\/ml|tablet|capsule|pills?|puffs?))", clean_line, re.IGNORECASE)
        dosage = dose_match.group(1).strip() if dose_match else "Not specified"

        if dose_match:
            name_part = clean_line[:dose_match.start()].strip()
            if not name_part:
                name_part = clean_line.split()[0]
        else:
            name_part = clean_line.split()[0] if clean_line else clean_line

        name_part = re.sub(r"[\(\):,]", " ", name_part).strip()
        if not name_part:
            name_part = clean_line

        route_match = re.search(r"\b(PO|oral|topical|sublingual|IV|intramuscular|subcutaneous|inhalation)\b", clean_line, re.IGNORECASE)
        route = route_match.group(1).upper() if route_match else ("Oral" if "PO" in clean_line.upper() or "tablet" in clean_line.lower() or "capsule" in clean_line.lower() else "Not specified")
        if route == "PO":
            route = "Oral"

        freq_match = re.search(r"\b(BID|TID|QID|QD|q\d+h|every\s+\d+\s+hours|once\s+daily|twice\s+daily|three\s+times\s+daily|four\s+times\s+daily|as\s+needed|PRN(?:[^\n,]*))\b", clean_line, re.IGNORECASE)
        frequency = freq_match.group(1).strip() if freq_match else "Not specified"

        dur_match = re.search(r"\b(x\s*\d+\s*days?|\d+\s*days?|for\s*\d+\s*weeks?|until\s+finished)\b", clean_line, re.IGNORECASE)
        duration = dur_match.group(1).strip() if dur_match else "As directed"

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
            id=f"med-{idx}",
            name=name_part,
            dosage=dosage,
            route=route,
            frequency=frequency,
            duration=duration,
            purpose="Prescribed medication as specified in discharge summary.",
            special_instructions=clean_line,
            source_citation=f"Discharge Summary - Medication Entry #{idx}",
            needs_review=needs_review,
            review_reason=review_reason
        ))

    return medications


def _parse_followups(text: str) -> List[FollowUpAppointment]:
    appointments: List[FollowUpAppointment] = []

    followup_match = re.search(
        r"(?:FOLLOW[\s-]*UP|OUTPATIENT\s*CARE|APPOINTMENTS|RECOVERY\s*PLAN)[\s\S]*?(?=(?:RECOVERY|INSTRUCTIONS|MEDICATIONS|WARNING|\Z))",
        text,
        re.IGNORECASE
    )

    section_text = followup_match.group(0) if followup_match else text
    raw_lines = [l.strip() for l in section_text.split('\n') if l.strip() and not re.match(r"^FOLLOW[\s-]*UP:?$", l.strip(), re.IGNORECASE)]

    for idx, line in enumerate(raw_lines, start=1):
        if not re.search(r"doctor|dr\.|clinic|hospital|PCP|surgeon|follow|within|\d{1,2}/\d{1,2}|\d+\s*days|weeks", line, re.IGNORECASE):
            continue

        clean_line = re.sub(r"^(?:\d+[\.\)]|[\-\*â€¢])\s*", "", line).strip()

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

        appointments.append(FollowUpAppointment(
            id=f"app-{idx}",
            doctor_or_dept=doc_or_dept,
            clinic_location="Refer to clinic/discharge instructions",
            date_time=date_time,
            purpose="Post-discharge evaluation and follow-up care.",
            instructions=clean_line,
            contact_phone=phone,
            is_missing_date=is_missing_date
        ))

    if not appointments:
        appointments.append(FollowUpAppointment(
            id="app-1",
            doctor_or_dept="Primary Care Provider / Surgeon",
            clinic_location="Not specified",
            date_time="Date Unspecified (Schedule within 1-2 weeks)",
            purpose="Routine post-discharge clinical evaluation.",
            instructions="Please contact your primary care doctor's office to confirm follow-up scheduling.",
            contact_phone="Not specified",
            is_missing_date=True
        ))

    return appointments


def _parse_recovery_sections(text: str, diagnosis: str) -> List[RecoveryInstructionSection]:
    sections: List[RecoveryInstructionSection] = []

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

    sections.append(RecoveryInstructionSection(
        id="sec-home",
        title="What should I do at home?",
        category="home_care",
        plain_text="Rest as instructed by your clinical team. Take all prescribed medications on schedule as directed. Keep any wound or incision clean and dry.",
        medical_text="Post-discharge home care instructions: Adhere to prescription medication schedule and rest recommendations.",
        priority="normal"
    ))

    warning_match = re.search(r"(?:WARNING\s*SIGNS|RED\s*FLAGS|WHEN\s*TO\s*SEEK\s*CARE)[\s:]*([^\n\r]+)", text, re.IGNORECASE)
    med_warning = warning_match.group(0).strip() if warning_match else "Red flags: Fever > 101Â°F, severe unrelieved pain, difficulty breathing, or unexpected bleeding."
    plain_warning = "Seek immediate emergency medical attention if you experience high fever, severe worsening pain not relieved by medicine, difficulty breathing, persistent vomiting, or severe bleeding."

    sections.append(RecoveryInstructionSection(
        id="sec-warning",
        title="Warning Signs Requiring Urgent Medical Attention",
        category="warning_signs",
        plain_text=plain_warning,
        medical_text=med_warning,
        priority="critical"
    ))

    sections.append(RecoveryInstructionSection(
        id="sec-contact",
        title="When to Contact the Healthcare Team",
        category="contact_team",
        plain_text="Contact your doctor's office or clinic for non-urgent questions about your healing, prescription refills, or appointment scheduling.",
        medical_text="Outpatient care support: Contact attending physician's office for post-discharge inquiries.",
        priority="normal"
    ))

    return sections
