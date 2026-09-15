# SIH26034 Python OCR Microservice

FastAPI Python microservice for real-time Optical Character Recognition and image quality assessment in the Legal Metrology Compliance Platform.

## Architecture
- **Framework**: FastAPI + Uvicorn
- **OCR Engine**: PyTorch EasyOCR (Deep Learning Text Detection & Recognition)
- **Image Processing**: OpenCV (Contrast enhancement, blur detection, resolution scoring)

## Running the Service
```bash
python -m uvicorn ai-service.app.main:app --port 8000 --reload
```
Or directly from `ai-service` directory:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
