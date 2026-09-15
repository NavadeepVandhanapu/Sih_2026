import cv2
import numpy as np
from typing import Tuple, Dict, Any

class ImagePreprocessor:
    @staticmethod
    def decode_image(image_bytes: bytes) -> np.ndarray:
        """Decode raw image bytes into OpenCV BGR numpy array."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image file bytes into valid OpenCV matrix")
        return img

    @staticmethod
    def analyze_quality(img: np.ndarray) -> Dict[str, Any]:
        """Compute real, empirical image quality indicators (blur, brightness, contrast, resolution)."""
        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Blur calculation via Laplacian variance
        blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # 2. Brightness (mean pixel intensity 0.0 - 1.0)
        brightness = float(np.mean(gray) / 255.0)

        # 3. Contrast (std deviation 0.0 - 1.0)
        contrast = float(np.std(gray) / 255.0)

        # 4. Resolution status
        min_dim = min(width, height)
        if min_dim >= 1080:
            res_status = "HIGH"
        elif min_dim >= 720:
            res_status = "GOOD"
        elif min_dim >= 480:
            res_status = "MODERATE"
        else:
            res_status = "LOW"

        # 5. Score calculation
        # Normalized blur score (typical sharp text produces variance > 100)
        blur_score = min(1.0, blur_variance / 250.0)
        contrast_score = min(1.0, contrast * 2.5)
        brightness_penalty = 1.0 - abs(brightness - 0.5) * 1.5
        brightness_score = max(0.2, min(1.0, brightness_penalty))

        overall_score = round(0.5 * blur_score + 0.3 * contrast_score + 0.2 * brightness_score, 2)
        is_usable = overall_score >= 0.25 and blur_variance >= 15.0

        return {
            "score": overall_score,
            "blur_variance": round(blur_variance, 2),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "resolution_status": res_status,
            "is_usable": is_usable,
        }

    @staticmethod
    def preprocess_for_ocr(img: np.ndarray) -> np.ndarray:
        """
        Enhance contrast/sharpness for OCR without altering physical image dimensions,
        preserving 1:1 original coordinate mapping.
        """
        # Contrast Limited Adaptive Histogram Equalization (CLAHE) on L channel of LAB
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return enhanced
