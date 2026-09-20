import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import DischargeSummaryData
from parser import extract_text_from_pdf_bytes, parse_discharge_text

app = FastAPI(
    title="DischargeGuard API",
    description="Backend service for discharge summary document processing and plain language parsing.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (port 5173 / 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DischargeGuard backend",
        "version": "1.0.0",
        "demo_mode": True
    }

@app.post("/api/upload-summary", response_model=DischargeSummaryData)
async def upload_discharge_summary(file: UploadFile = File(...)):
    """Receives an uploaded PDF/image file, extracts text, and parses structured recovery data."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    
    filename = file.filename
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Extract text from file bytes
    text = extract_text_from_pdf_bytes(content)
    
    # Parse text into structured schema
    parsed_data = parse_discharge_text(text, filename)
    return parsed_data

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
    return parse_discharge_text(sample_text, "Sample_Discharge_Summary_Gallbladder.pdf")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
