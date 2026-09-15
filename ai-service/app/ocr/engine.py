import easyocr
import numpy as np
from typing import Dict, Any, List
from .preprocessing import ImagePreprocessor

class OCREngineService:
    def __init__(self, languages: List[str] = None):
        if languages is None:
            languages = ['en']
        # Initialize EasyOCR reader (CPU mode for universal deployment, verbose=False for Windows console safety)
        self.reader = easyocr.Reader(languages, gpu=False, verbose=False)

    def process_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        # 1. Decode Image
        img = ImagePreprocessor.decode_image(image_bytes)
        height, width, channels = img.shape

        # 2. Compute Quality Indicators
        quality = ImagePreprocessor.analyze_quality(img)

        if not quality["is_usable"]:
            return {
                "success": False,
                "error": "LOW_IMAGE_QUALITY",
                "image": {"width": width, "height": height, "channels": channels},
                "quality": quality,
                "rawText": "",
                "wordCount": 0,
                "lines": [],
                "regions": [],
            }

        # 3. Optional Contrast Enhancement
        processed_img = ImagePreprocessor.preprocess_for_ocr(img)

        # 4. Run EasyOCR Inference
        # Returns list of tuples: (bbox_polygon, text, confidence)
        results = self.reader.readtext(processed_img)

        regions = []
        lines_text = []

        for item in results:
            polygon, text, conf = item
            clean_text = text.strip()
            if not clean_text or conf < 0.15:
                continue

            # Convert polygon numpy points to floats
            pts = np.array(polygon)
            min_x = float(np.min(pts[:, 0]))
            min_y = float(np.min(pts[:, 1]))
            max_x = float(np.max(pts[:, 0]))
            max_y = float(np.max(pts[:, 1]))

            bbox = {
                "x": round(max(0.0, min_x), 2),
                "y": round(max(0.0, min_y), 2),
                "width": round(max(1.0, max_x - min_x), 2),
                "height": round(max(1.0, max_y - min_y), 2),
            }

            poly_list = [[round(float(p[0]), 2), round(float(p[1]), 2)] for p in polygon]

            regions.append({
                "text": clean_text,
                "confidence": round(float(conf), 4),
                "boundingBox": bbox,
                "polygon": poly_list,
            })
            lines_text.append(clean_text)

        # Sort regions top-to-bottom
        regions.sort(key=lambda r: (r["boundingBox"]["y"], r["boundingBox"]["x"]))

        raw_text = "\n".join(lines_text)
        word_count = len(raw_text.split())

        return {
            "success": True,
            "provider": "PyTorch EasyOCR Neural Engine (v1.7)",
            "image": {"width": width, "height": height, "channels": channels},
            "quality": quality,
            "rawText": raw_text,
            "wordCount": word_count,
            "lines": lines_text,
            "regions": regions,
        }
