import cv2
import easyocr
import numpy as np

img_path = "apps/api/uploads/scan_1789495186532_2f09bbf169cb1336.jpeg"
img = cv2.imread(img_path)
reader = easyocr.Reader(['en'], gpu=False, verbose=False)

print(f"Image shape: {img.shape}")

# 1. Test Rotations (90, 180, 270 degrees)
for angle in [90, 180, 270]:
    if angle == 90:
        rot = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif angle == 180:
        rot = cv2.rotate(img, cv2.ROTATE_180)
    else:
        rot = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    
    res = reader.readtext(rot, text_threshold=0.2, low_text=0.15)
    print(f"\n--- Rotation {angle}° (Count: {len(res)}) ---")
    for bbox, text, conf in res:
        print(f"  [{conf:.3f}] {text}")

# 2. Test Controlled Quadrant / Grid Cropping (Multi-scale / Multi-region OCR)
h, w = img.shape[:2]
crops = [
    ("Top Half", img[0:int(h*0.5), 0:w]),
    ("Bottom Half", img[int(h*0.4):h, 0:w]),
    ("Left Half", img[0:h, 0:int(w*0.5)]),
    ("Right Half", img[0:h, int(w*0.4):w]),
    ("Center Panel", img[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]),
    ("Bottom Right Corner", img[int(h*0.5):h, int(w*0.4):w]),
]

print("\n--- Testing Region Cropping (Multi-Region Passes) ---")
for name, crop in crops:
    c_h, c_w = crop.shape[:2]
    # Resize crop if small so text is large enough for EasyOCR
    scale = 1.5 if c_h < 800 else 1.0
    if scale != 1.0:
        crop_res = cv2.resize(crop, (int(c_w * scale), int(c_h * scale)), interpolation=cv2.INTER_CUBIC)
    else:
        crop_res = crop
    
    res = reader.readtext(crop_res, text_threshold=0.2, low_text=0.15, link_threshold=0.2)
    print(f"Crop '{name}' ({crop.shape}): {len(res)} regions detected")
    for bbox, text, conf in res:
        print(f"   [{conf:.3f}] {text}")

# 3. Preprocessing techniques: Bilateral Filter, Otsu Binarization, Adaptive Thresholding, CLAHE + Sharp
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Morphological gradient / Top-Hat for small text extraction
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
res_tophat = reader.readtext(tophat, text_threshold=0.2, low_text=0.15)
print(f"\nTopHat Filter (Count: {len(res_tophat)}):")
for bbox, text, conf in res_tophat:
    print(f"  [{conf:.3f}] {text}")

# Adaptive threshold
adapt_thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10)
res_adapt = reader.readtext(adapt_thresh, text_threshold=0.2, low_text=0.15)
print(f"\nAdaptive Threshold (Count: {len(res_adapt)}):")
for bbox, text, conf in res_adapt:
    print(f"  [{conf:.3f}] {text}")
