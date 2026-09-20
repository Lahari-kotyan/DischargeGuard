import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import DischargeSummaryData
from parser import extract_text_from_file_bytes, parse_discharge_text

app = FastAPI(
    title="DischargeGuard API",
    description=(
        "API for extracting and structuring discharge-summary "
        "information from PDF and image uploads."
    ),
    version="1.0.0",
)

# Configure CORS origins
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()] if cors_origins_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

@app.get("/")
def root():
    return {
        "service": "DischargeGuard backend",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DischargeGuard backend",
        "version": "1.0.0",
        "prototype_notice": "DischargeGuard is a technical prototype for testing and demonstration purposes only."
    }

@app.post("/api/upload-summary", response_model=DischargeSummaryData)
async def upload_discharge_summary(file: UploadFile = File(...)):
    """Receives an uploaded PDF/image file, extracts text, and parses structured recovery data."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    filename = file.filename
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
    extension = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    if extension and extension not in allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a PDF, PNG, JPG, JPEG, WEBP, TIF, or TIFF."
        )

    try:
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="Uploaded file exceeds maximum allowed limit of 15 MB.")

        # Extract text from PDF or Image file bytes using PyMuPDF + PyTesseract OCR
        extracted_text = extract_text_from_file_bytes(content, filename)

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(status_code=422, detail="No readable text was extracted from the file.")

        # Parse text into structured Pydantic schema
        parsed_data = parse_discharge_text(extracted_text, filename, is_demo=False)
        return parsed_data

    except HTTPException as http_exc:
        raise http_exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        await file.close()

@app.get("/api/sample-summary", response_model=DischargeSummaryData)
def get_sample_discharge_summary():
    """Returns a pre-processed demo discharge summary dataset for instant demo testing."""
    sample_text = """
    ST. JUDE METROPOLITAN HOSPITAL - DISCHARGE SUMMARY
    Patient Name: Alex Morgan
    MRN: MRN-8941029
    Admission Date: Sept 12, 2026
    Discharge Date: Sept 16, 2026
    Attending Physician: Dr. Sarah Jenkins, MD
    Hospital: St. Jude Metropolitan Hospital
    Diagnosis: Laparoscopic Cholecystectomy - Acute Cholecystitis

    Discharge Medications:
    1. Augmentin 875/125 mg PO BID x 7 days
    2. Tylenol 500 mg PO q6h PRN pain
    3. Oxycodone 5 mg PO PRN breakthrough pain (frequency missing)
    4. Colace 100 mg PO BID

    Follow-Up Instructions:
    - Surgical Clinic: Sept 30, 2026 @ 10:30 AM with Dr. Jenkins
    - PCP Dr. Robert Chen: Schedule within 3 weeks
    """
    return parse_discharge_text(sample_text, "Sample_Discharge_Summary_Gallbladder.pdf", is_demo=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
