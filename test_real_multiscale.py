import cv2
import numpy as np
import easyocr

img_path = "apps/api/uploads/scan_1789495186532_2f09bbf169cb1336.jpeg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

reader = easyocr.Reader(['en'], gpu=False, verbose=False)

print(f"=== TESTING MULTI-SCALE & ADVANCED PREPROCESSING ON REAL PACKAGING IMAGE ({w}x{h}) ===")

# Strategy 1: Controlled multi-scale passes (Full Image, 2x Upscale, Top-Half 2x, Bottom-Half 2x)
scales_and_crops = [
    ("Full (1.0x)", img),
    ("Full (2.0x)", cv2.resize(img, (w*2, h*2), interpolation=cv2.INTER_CUBIC)),
    ("Top Half (2.0x)", cv2.resize(img[0:int(h*0.55), 0:w], (w*2, int(h*1.1)), interpolation=cv2.INTER_CUBIC)),
    ("Bottom Half (2.0x)", cv2.resize(img[int(h*0.45):h, 0:w], (w*2, int(h*1.1)), interpolation=cv2.INTER_CUBIC)),
]

for name, pass_img in scales_and_crops:
    # Test with relaxed detection parameters
    results = reader.readtext(
        pass_img,
        canvas_size=2560,
        mag_ratio=2.0,
        text_threshold=0.15,
        low_text=0.1,
        link_threshold=0.15,
        min_size=5,
    )
    print(f"\n[{name}] Detected {len(results)} regions:")
    for bbox, text, conf in results:
        print(f"  ({conf:.3f}) '{text}'")
