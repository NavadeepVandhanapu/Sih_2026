import sys
import easyocr

print("Downloading and caching EasyOCR models (Craft & English Recognizer)...")
reader = easyocr.Reader(['en'], gpu=False, download_enabled=True, verbose=False)
print("✅ EasyOCR Models successfully downloaded and cached in ~/.EasyOCR/model!")
