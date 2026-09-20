import pytest
import io
from fastapi.testclient import TestClient
from main import app
from parser import parse_discharge_text, extract_text_from_file_bytes

client = TestClient(app)

def test_robert_vance_miller_demographics():
    """
    Tests extraction for Robert Vance Miller discharge summary:
    - Patient Name: Robert Vance Miller
    - MRN: 9920148
    - Hospital: METROPOLITAN GENERAL HOSPITAL
    - Attending Physician: Dr. Evelyn Reed, MD
    - Admission Date: 09/17/2026
    - Discharge Date: 09/20/2026
    - Discharge Diagnosis: Acute Calculous Cholecystitis (ICD-10: K80.00)
    - Procedure: Laparoscopic Cholecystectomy
    """
    raw_text = """
    METROPOLITAN GENERAL HOSPITAL
    DISCHARGE SUMMARY

    Patient Name: Robert Vance Miller
    MRN: 9920148
    Attending Physician: Dr. Evelyn Reed, MD
    Admission Date: 09/17/2026
    Discharge Date: 09/20/2026

    Discharge Diagnosis: Acute Calculous Cholecystitis (ICD-10: K80.00)
    Procedure: Laparoscopic Cholecystectomy

    DISCHARGE MEDICATIONS:
    1. Augmentin 875mg PO BID x 7 days
    """

    result = parse_discharge_text(raw_text, "Robert_Vance_Miller_Discharge.pdf", is_demo=False)

    assert result.patient_visit.patient_name == "Robert Vance Miller"
    assert result.patient_visit.mrn == "9920148"
    assert "METROPOLITAN GENERAL HOSPITAL" in result.patient_visit.hospital_name
    assert result.patient_visit.attending_physician == "Dr. Evelyn Reed, MD"
    assert result.patient_visit.admission_date == "09/17/2026"
    assert result.patient_visit.discharge_date == "09/20/2026"
    assert "Acute Calculous Cholecystitis (ICD-10: K80.00)" in result.patient_visit.discharge_diagnosis
    assert result.patient_visit.procedure == "Laparoscopic Cholecystectomy"
    assert result.is_demo is False


def test_alternative_headings_and_next_line_values():
    """
    Tests parsing when values appear on the following line and under alternative headings:
    - Patient Full Name
    - Patient ID
    - Consultant
    - Admitted On
    - Discharged On
    - Principal Diagnosis with ICD-10
    - Surgery Performed: None
    """
    next_line_text = """
    ST. MARY CLINIC

    Patient Full Name:
    Sarah Jessica Parker

    Patient ID:
    PX-883912

    Consultant:
    Dr. Arthur Pendelton

    Admitted On:
    2026-09-10

    Discharged On:
    2026-09-15

    Principal Diagnosis:
    Community-Acquired Pneumonia (ICD-10: J18.9)

    Surgery Performed:
    None
    """

    result = parse_discharge_text(next_line_text, "Sarah_Parker.pdf", is_demo=False)

    assert result.patient_visit.patient_name == "Sarah Jessica Parker"
    assert result.patient_visit.mrn == "PX-883912"
    assert result.patient_visit.attending_physician == "Dr. Arthur Pendelton"
    assert result.patient_visit.admission_date == "2026-09-10"
    assert result.patient_visit.discharge_date == "2026-09-15"
    assert "Community-Acquired Pneumonia (ICD-10: J18.9)" in result.patient_visit.discharge_diagnosis
    assert result.patient_visit.procedure == "None"


def test_multiple_dates_handling():
    """Verifies that admission, discharge, surgery, and follow-up dates are correctly isolated."""
    multi_date_text = """
    EXAMPLE HOSPITAL
    Patient: John Doe
    MRN: 112233
    Date of Admission: 17 Sep 2026
    Date of Discharge: 20 Sep 2026
    Surgery Date: 18 Sep 2026
    Final Diagnosis: Acute Appendicitis
    Procedure: Appendectomy
    FOLLOW UP:
    - Clinic visit on 27 Sep 2026
    """

    result = parse_discharge_text(multi_date_text, "John_Doe.pdf", is_demo=False)

    assert result.patient_visit.admission_date == "17 Sep 2026"
    assert result.patient_visit.discharge_date == "20 Sep 2026"
    assert result.patient_visit.admission_date != result.patient_visit.discharge_date


def test_procedure_explicitly_not_performed():
    """Verifies procedure explicitly documented as not performed."""
    text = """
    Patient Name: Alice Smith
    MRN: 445566
    Diagnosis: Acute Viral Gastroenteritis
    Procedure: No surgical procedure performed
    """

    result = parse_discharge_text(text, "Alice_Smith.pdf", is_demo=False)

    assert result.patient_visit.procedure == "No surgical procedure performed"


def test_jamie_example_fictional_pdf_parsing():
    fictional_text = """
    EXAMPLE COMMUNITY HOSPITAL - DISCHARGE SUMMARY
    Patient Name: Jamie Example
    MRN: EX-99201
    Admission Date: 17 September 2026
    Discharge Date: 20 September 2026
    Attending Physician: Dr. Taylor Morgan, MD
    Discharge Diagnosis: acute viral respiratory infection

    DISCHARGE MEDICATIONS:
    1. Examplemed 500mg PO BID x 5 days
    2. Samplecough syrup 10ml PO q6h PRN cough (interval missing)

    FOLLOW UP:
    - Primary Care Clinic: follow up within 5-7 days
    """

    result = parse_discharge_text(fictional_text, "Jamie_Example_Discharge.pdf", is_demo=False)

    assert result.patient_visit.patient_name == "Jamie Example"
    assert result.patient_visit.patient_name != "Alex Morgan"
    assert "example community hospital" in result.patient_visit.hospital_name.lower()
    assert result.patient_visit.admission_date == "17 September 2026"
    assert result.patient_visit.discharge_date == "20 September 2026"
    assert "acute viral respiratory infection" in result.patient_visit.discharge_diagnosis.lower()

    med_names = [m.name for m in result.medications]
    assert any("Examplemed" in m for m in med_names)
    assert any("Samplecough" in m for m in med_names)
    assert not any("Augmentin" in m for m in med_names)
    assert not any("Oxycodone" in m for m in med_names)

    assert len(result.follow_up_appointments) > 0
    followup = result.follow_up_appointments[0]
    assert followup.is_missing_date is True
    assert "5-7 days" in followup.date_time
    assert result.is_demo is False


def test_missing_patient_info_defaults_to_not_specified():
    sparse_text = """
    DISCHARGE SUMMARY
    Notes: Patient tolerated diet.
    DISCHARGE MEDICATIONS:
    1. Testmed 10mg PO QD
    """

    result = parse_discharge_text(sparse_text, "Sparse_Doc.pdf", is_demo=False)

    assert result.patient_visit.patient_name == "Not specified"
    assert result.patient_visit.mrn == "Not specified"
    assert result.patient_visit.attending_physician == "Not specified"
    assert result.patient_visit.patient_name != "Alex Morgan"


def test_upload_endpoint_no_demo_data_substitution():
    """Tests POST /api/upload-summary with an uploaded PDF file."""
    pdf_content = b"%PDF-1.4\n%Fake PDF content for testing\nMETROPOLITAN GENERAL HOSPITAL\nPatient Name: Upload Test Patient\nMRN: UP-9988\n"
    
    response = client.post(
        "/api/upload-summary",
        files={"file": ("test_upload.pdf", pdf_content, "application/pdf")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_demo"] is False
    assert data["patient_visit"]["patient_name"] == "Upload Test Patient"
    assert data["patient_visit"]["patient_name"] != "Alex Morgan"


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_sample_summary_endpoint():
    response = client.get("/api/sample-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["is_demo"] is True
    assert data["patient_visit"]["patient_name"] == "Alex Morgan"
