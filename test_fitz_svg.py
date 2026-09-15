import fitz # PyMuPDF
import cv2
import numpy as np

def convert_svg_with_fitz(svg_path: str):
    doc = fitz.open(svg_path)
    page = doc[0]
    pix = page.get_pixmap(dpi=300) # Render high resolution image from SVG vector!
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
    if pix.n == 4: # RGBA -> BGR
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
    elif pix.n == 3: # RGB -> BGR
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img

img = convert_svg_with_fitz("public/samples/apex_biscuits.svg")
print("High-res PyMuPDF SVG render shape:", img.shape)

import easyocr
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
results = reader.readtext(img, mag_ratio=1.5)

print(f"\nDetected {len(results)} regions:")
for bbox, text, conf in results:
    print(f"  [{conf:.3f}] '{text}'")
