from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .ocr.engine import OCREngineService
from .schemas.response import OCRResponse

app = FastAPI(
    title="Legal Metrology AI/OCR Microservice",
    description="Real Neural OCR and Image Quality Inspection Service for SIH26034 Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton OCR Engine instance
ocr_engine = OCREngineService(languages=['en'])

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "SIH26034 Legal Metrology Python OCR Microservice",
        "ocr_engine": "PyTorch EasyOCR (v1.7)",
        "device": "cpu",
    }

@app.post("/ocr", response_model=OCRResponse)
async def process_ocr(file: UploadFile = File(...)):
    # Validate MIME type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"]
    if file.content_type and file.content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{file.content_type}'. Permitted formats: JPEG, PNG, WEBP."
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds maximum 15MB limit.")

        result = ocr_engine.process_image_bytes(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing Error: {str(e)}")
