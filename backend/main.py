
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import DischargeSummaryData
from parser import extract_text_from_pdf_bytes, parse_discharge_text

app = FastAPI(
    title="DischargeGuard API",
    description=(
        "API for extracting and structuring discharge-summary "
        "information from PDF and image uploads."
    ),
    version="1.0.0",
)

# CORS configuration
# For production, replace "*" with your actual frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


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
        "demo_mode": True,
    }


@app.get("/api/sample-summary", response_model=DischargeSummaryData)
def get_sample_discharge_summary():
    """
    Return a clearly labeled fictional example.
    This is demo data, not extracted from an uploaded file.
    """
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

    result = parse_discharge_text(
        sample_text,
        "fictional_sample_discharge_summary.txt",
    )

    return result


@app.post(
    "/api/upload-summary",
    response_model=DischargeSummaryData,
)
async def upload_discharge_summary(
    file: UploadFile = File(...),
):
    """
    Accept a PDF or supported image, extract readable text,
    and parse the extracted content.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    allowed_extensions = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".tif",
        ".tiff",
    }

    filename = file.filename
    extension = "." + filename.rsplit(".", 1)[-1].lower() \
        if "." in filename else ""

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported file type. "
                "Upload a PDF, PNG, JPG, JPEG, WEBP, TIF, or TIFF."
            ),
        )

    # Basic upload size limit: 10 MB
    max_file_size = 10 * 1024 * 1024

    try:
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        if len(file_bytes) > max_file_size:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum size is 10 MB.",
            )

        try:
            extracted_text = extract_text_from_pdf_bytes(
                file_bytes,
                filename,
            )
        except RuntimeError as exc:
            raise HTTPException(
                status_code=503,
                detail=str(exc),
            ) from exc
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc

        if not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text was extracted from the file.",
            )

        result = parse_discharge_text(
            extracted_text,
            filename,
        )

        return result

    finally:
        await file.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
