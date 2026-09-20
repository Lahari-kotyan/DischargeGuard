
import re
import datetime
import uuid
import io
from typing import Optional

from schemas import (
    DischargeSummaryData,
    PatientVisitInfo,
    MedicationItem,
    FollowUpAppointment,
    RecoveryInstructionSection,
    FlaggedIssue,
)

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None


def extract_text_from_pdf_bytes(
    file_bytes: bytes,
    filename: str = ""
) -> str:
    """
    Extract text from PDF or image bytes.
    Supports text PDFs directly.
    Images require Pillow, pytesseract, and Tesseract OCR.
    """

    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    # PDF extraction
    if extension == "pdf" or file_bytes.startswith(b"%PDF"):
        if fitz is None:
            raise RuntimeError("PyMuPDF is not installed.")

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            pages = [page.get_text("text") for page in doc]
            text = "\n".join(pages).strip()

            if text:
                return text

            raise ValueError(
                "No selectable text found in PDF. "
                "Scanned PDFs need OCR support."
            )

        except Exception as exc:
            raise ValueError(f"Could not read PDF: {exc}") from exc

    # Image OCR
    if extension in {"png", "jpg", "jpeg", "webp", "tif", "tiff"}:
        if Image is None or pytesseract is None:
            raise RuntimeError(
                "Image OCR dependencies are missing. "
                "Install Pillow, pytesseract, and Tesseract OCR."
            )

        try:
            image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            text = pytesseract.image_to_string(image).strip()

            if not text:
                raise ValueError("OCR could not detect readable text.")

            return text

        except Exception as exc:
            raise ValueError(f"Could not process image: {exc}") from exc

    raise ValueError(
        "Unsupported file type. Upload a PDF, PNG, JPG, JPEG, or WEBP."
    )


def _extract_regex(
    text: str,
    patterns: list[str],
    default: str = "Not specified"
) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            value = match.group(1).strip()
            if value:
                return value
    return default


def _section(
    section_id: str,
    title: str,
    category: str,
    plain_text: str,
    medical_text: str = "",
    priority: str = "normal",
) -> RecoveryInstructionSection:
    return RecoveryInstructionSection(
        id=section_id,
        title=title,
        category=category,
        plain_text=plain_text,
        medical_text=medical_text,
        priority=priority,
    )


def parse_discharge_text(
    text: str,
    filename: str
) -> DischargeSummaryData:
    """
    Extract basic patient details and create a conservative
    structured result from the supplied document text.

    This parser does not infer medication instructions or
    generate patient-specific medical advice.
    """

    if not text or not text.strip():
        raise ValueError("No readable text was extracted.")

    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Patient and visit details
    patient_name = _extract_regex(
        text,
        [r"Patient Name:\s*([^\n\r]+)",
         r"Name of Patient:\s*([^\n\r]+)"]
    )

    mrn = _extract_regex(
        text,
        [r"(?:MRN|Medical Record #|Medical Record Number):\s*([^\n\r]+)"]
    )

    admission_date = _extract_regex(
        text,
        [r"Admission Date:\s*([^\n\r]+)",
         r"Admitted:\s*([^\n\r]+)"]
    )

    discharge_date = _extract_regex(
        text,
        [r"Discharge Date:\s*([^\n\r]+)",
         r"Discharged:\s*([^\n\r]+)"]
    )

    attending = _extract_regex(
        text,
        [r"Attending Physician:\s*([^\n\r]+)",
         r"Attending Doctor:\s*([^\n\r]+)"]
    )

    hospital = _extract_regex(
        text,
        [r"Hospital:\s*([^\n\r]+)",
         r"Hospital Name:\s*([^\n\r]+)"]
    )

    diagnosis = _extract_regex(
        text,
        [r"(?:Discharge Diagnosis|Diagnosis):\s*([^\n\r]+)"]
    )

    patient_info = PatientVisitInfo(
        patient_name=patient_name,
        mrn=mrn,
        admission_date=admission_date,
        discharge_date=discharge_date,
        attending_physician=attending,
        hospital_name=hospital,
        discharge_diagnosis=diagnosis,
        summary_overview=(
            "Extracted from the uploaded document. "
            "Please verify these details against the original."
        ),
    )

    # Medication extraction:
    # Capture lines under a Discharge Medications heading.
    medications = []
    medication_lines = []
    in_medications = False

    for line in text.splitlines():
        stripped = line.strip()

        if re.search(
            r"discharge medications|medications at discharge|medication list",
            stripped,
            re.IGNORECASE,
        ):
            in_medications = True
            continue

        if in_medications and re.search(
            r"follow[- ]?up|discharge instructions|allergies|diagnosis",
            stripped,
            re.IGNORECASE,
        ):
            in_medications = False

        if in_medications and stripped:
            medication_lines.append(stripped)

    for index, line in enumerate(medication_lines, start=1):
        # Remove list numbering such as "1." or "2)"
        clean_line = re.sub(r"^\s*\d+[\.\)]\s*", "", line)

        # Skip headings and very short lines
        if len(clean_line) < 3:
            continue

        medications.append(
            MedicationItem(
                id=f"med-{index}",
                name=clean_line,
                dosage="See original document",
                route="See original document",
                frequency="Needs verification",
                duration="See original document",
                purpose="Not inferred",
                special_instructions=(
                    "Verify the exact medication, dose, timing, "
                    "and duration with your healthcare professional."
                ),
                source_citation="Extracted medication section",
                needs_review=True,
                review_reason=(
                    "Medication details require verification. "
                    "This parser does not reliably separate fields."
                ),
            )
        )

    # Follow-up extraction: preserve matching lines without inventing dates.
    follow_up_appointments = []
    followup_lines = []
    in_followup = False

    for line in text.splitlines():
        stripped = line.strip()

        if re.search(
            r"follow[- ]?up|appointments",
            stripped,
            re.IGNORECASE,
        ):
            in_followup = True
            continue

        if in_followup and re.search(
            r"discharge medications|home care|wound care",
            stripped,
            re.IGNORECASE,
        ):
            in_followup = False

        if in_followup and stripped:
            followup_lines.append(stripped)

    for index, line in enumerate(followup_lines, start=1):
        follow_up_appointments.append(
            FollowUpAppointment(
                id=f"app-{index}",
                doctor_or_dept=line,
                clinic_location="Not specified",
                date_time="Verify in original document",
                purpose="Follow-up instruction extracted from document",
                instructions=(
                    "Contact the clinic to confirm the appointment "
                    "date and time."
                ),
                contact_phone="Not specified",
                is_missing_date=True,
            )
        )

    # Preserve text without generating patient-specific medical advice.
    recovery_sections = [
        _section(
            "sec-extracted",
            "Extracted discharge text",
            "document_text",
            text[:5000],
            medical_text="Text extracted from uploaded document.",
        )
    ]

    # Flag missing patient details and medication verification.
    flagged_issues = []

    if patient_name == "Not specified":
        flagged_issues.append(
            FlaggedIssue(
                id="flag-patient-name",
                title="Patient name not detected",
                category="document",
                severity="warning",
                explanation=(
                    "The parser could not identify a patient name "
                    "using its supported patterns."
                ),
                source_location="Patient details",
                recommended_action=(
                    "Check the original document and correct the "
                    "patient details if needed."
                ),
            )
        )

    if medications:
        flagged_issues.append(
            FlaggedIssue(
                id="flag-med-review",
                title="Medication details need verification",
                category="medication",
                severity="warning",
                explanation=(
                    "Medication text was extracted, but individual "
                    "dose and schedule fields were not reliably parsed."
                ),
                source_location="Discharge medication section",
                recommended_action=(
                    "Compare every medication with the original "
                    "discharge instructions and confirm uncertainties "
                    "with a pharmacist or prescriber."
                ),
            )
        )

    return DischargeSummaryData(
        doc_id=doc_id,
        filename=filename,
        upload_timestamp=timestamp,
        patient_visit=patient_info,
        medications=medications,
        recovery_sections=recovery_sections,
        follow_up_appointments=follow_up_appointments,
        flagged_issues=flagged_issues,
        raw_text=text[:5000],
    )
