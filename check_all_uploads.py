import cv2
import easyocr
import os
import glob

reader = easyocr.Reader(['en'], gpu=False, verbose=False)
files = sorted(glob.glob("apps/api/uploads/*.*"))

for fpath in files:
    if fpath.endswith(".gitkeep"): continue
    img = cv2.imread(fpath)
    if img is None: continue
    print(f"\n==========================================")
    print(f"File: {fpath} | Shape: {img.shape}")
    res = reader.readtext(img, text_threshold=0.2, low_text=0.15, mag_ratio=1.5)
    print(f"Count: {len(res)}")
    for bbox, text, conf in res:
        print(f"  [{conf:.3f}] {text}")
