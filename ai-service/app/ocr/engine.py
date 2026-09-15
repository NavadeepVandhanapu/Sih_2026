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
                "provider": "PyTorch EasyOCR Neural Engine (v1.7)",
                "error": "LOW_IMAGE_QUALITY",
                "image": {"width": width, "height": height, "channels": channels},
                "quality": quality,
                "rawText": "",
                "wordCount": 0,
                "lines": [],
                "regions": [],
            }

        # 3. Optional Contrast Enhancement & Speed Optimization for High-Res Photos
        processed_img = ImagePreprocessor.preprocess_for_ocr(img)

        max_dim = max(height, width)
        scale = 1.0
        if max_dim > 2000:
            scale = 2000.0 / max_dim
            new_w = int(width * scale)
            new_h = int(height * scale)
            import cv2
            ocr_input = cv2.resize(processed_img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        else:
            ocr_input = processed_img

        # 4. Run EasyOCR Inference with sensitive detection thresholds for package declarations
        # Parameters tuned for small print text (Consumer Care, USP, Mfg date)
        easyocr_params = {
            "canvas_size": 2560,
            "mag_ratio": 1.5,
            "text_threshold": 0.25,
            "low_text": 0.20,
            "link_threshold": 0.25,
            "min_size": 3,
        }

        passes = [("Full Image", ocr_input, scale, 0.0, 0.0)]

        # Controlled Multi-Scale Region Passes for dense/complex package layouts
        if height >= 1000 and width >= 800:
            import cv2
            # Upper half high-resolution crop
            crop_top = processed_img[0:int(height * 0.55), 0:width]
            passes.append(("Top Half Crop", crop_top, 1.0, 0.0, 0.0))
            # Lower half high-resolution crop
            crop_bottom = processed_img[int(height * 0.45):height, 0:width]
            passes.append(("Bottom Half Crop", crop_bottom, 1.0, 0.0, float(int(height * 0.45))))

        raw_regions = []

        for pass_name, pass_img, p_scale, offset_x, offset_y in passes:
            try:
                pass_results = self.reader.readtext(pass_img, **easyocr_params)
            except Exception:
                continue

            for item in pass_results:
                polygon, text, conf = item
                clean_text = text.strip()
                if not clean_text or conf < 0.10:
                    continue

                pts = np.array(polygon, dtype=np.float64)
                if p_scale != 1.0:
                    pts = pts / p_scale

                pts[:, 0] += offset_x
                pts[:, 1] += offset_y

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

                poly_list = [[round(float(p[0]), 2), round(float(p[1]), 2)] for p in pts]

                raw_regions.append({
                    "text": clean_text,
                    "confidence": round(float(conf), 4),
                    "boundingBox": bbox,
                    "polygon": poly_list,
                })

        # Intelligent IoU Deduplication to prevent overlapping bounding box duplicates across passes
        regions = self._deduplicate_regions(raw_regions)

        lines_text = [r["text"] for r in regions]
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

    @staticmethod
    def _deduplicate_regions(regions: List[Dict[str, Any]], iou_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """Deduplicate overlapping OCR bounding boxes across multi-scale passes while keeping higher confidence."""
        sorted_regs = sorted(regions, key=lambda r: r["confidence"], reverse=True)
        kept = []

        for r in sorted_regs:
            duplicate = False
            for k in kept:
                box1 = r["boundingBox"]
                box2 = k["boundingBox"]
                x1 = max(box1["x"], box2["x"])
                y1 = max(box1["y"], box2["y"])
                x2 = min(box1["x"] + box1["width"], box2["x"] + box2["width"])
                y2 = min(box1["y"] + box1["height"], box2["y"] + box2["height"])

                inter_w = max(0.0, x2 - x1)
                inter_h = max(0.0, y2 - y1)
                inter_area = inter_w * inter_h

                area1 = box1["width"] * box1["height"]
                area2 = box2["width"] * box2["height"]
                union_area = area1 + area2 - inter_area

                iou = (inter_area / union_area) if union_area > 0 else 0.0
                text_equal = r["text"].strip().lower() == k["text"].strip().lower()

                if iou > iou_threshold or (text_equal and iou > 0.15):
                    duplicate = True
                    break

            if not duplicate:
                kept.append(r)

        kept.sort(key=lambda r: (r["boundingBox"]["y"], r["boundingBox"]["x"]))
        return kept
