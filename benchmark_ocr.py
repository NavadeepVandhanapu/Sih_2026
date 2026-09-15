import cv2
import easyocr
import numpy as np
import json

img_path = "apps/api/uploads/scan_1789495186532_2f09bbf169cb1336.jpeg"
img = cv2.imread(img_path)

print(f"Original image shape: {img.shape}")

# Initialize reader
reader = easyocr.Reader(['en'], gpu=False, verbose=False)

# Test 1: Original readtext default
res1 = reader.readtext(img)
print(f"\n--- Test 1: Default readtext (Count: {len(res1)}) ---")
for bbox, text, conf in res1:
    print(f"  [{conf:.4f}] {text}")

# Test 2: Low threshold + mag_ratio 1.5
res2 = reader.readtext(img, mag_ratio=1.5, text_threshold=0.3, low_text=0.25, link_threshold=0.3)
print(f"\n--- Test 2: mag_ratio=1.5, text_thresh=0.3, low_text=0.25 (Count: {len(res2)}) ---")
for bbox, text, conf in res2:
    print(f"  [{conf:.4f}] {text}")

# Test 3: Contrast enhancement + Unsharp Masking + mag_ratio=1.5
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
l, a, b = cv2.split(lab)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
cl = clahe.apply(l)
enhanced = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)

# Unsharp mask
gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
unsharp = cv2.addWeighted(enhanced, 1.5, gaussian, -0.5, 0)

res3 = reader.readtext(unsharp, mag_ratio=1.5, text_threshold=0.25, low_text=0.2, link_threshold=0.25)
print(f"\n--- Test 3: Enhanced + Unsharp + mag_ratio=1.5, low thresholds (Count: {len(res3)}) ---")
for bbox, text, conf in res3:
    print(f"  [{conf:.4f}] {text}")

# Test 4: Upscaling image x1.5 / x2.0 for small text
h, w = img.shape[:2]
resized_x2 = cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
res4 = reader.readtext(resized_x2, mag_ratio=1.5, text_threshold=0.25, low_text=0.2, link_threshold=0.25)
print(f"\n--- Test 4: Resized x2.0 + mag_ratio=1.5 (Count: {len(res4)}) ---")
for bbox, text, conf in res4:
    print(f"  [{conf:.4f}] {text}")
