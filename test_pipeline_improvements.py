import cv2
import easyocr
import numpy as np
import fitz
import json

def calculate_iou(box1, box2):
    # box format: {"x": float, "y": float, "width": float, "height": float}
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
    
    if union_area <= 0:
        return 0.0
    return inter_area / union_area

def deduplicate_regions(regions, iou_threshold=0.5):
    # Sort regions by confidence descending so higher confidence is kept
    sorted_regs = sorted(regions, key=lambda r: r["confidence"], reverse=True)
    kept = []
    
    for r in sorted_regs:
        duplicate = False
        for k in kept:
            # Check text similarity or IoU
            iou = calculate_iou(r["boundingBox"], k["boundingBox"])
            if iou > iou_threshold or (r["text"].strip().lower() == k["text"].strip().lower() and iou > 0.2):
                duplicate = True
                break
        if not duplicate:
            kept.append(r)
            
    # Sort top to bottom, left to right
    kept.sort(key=lambda r: (r["boundingBox"]["y"], r["boundingBox"]["x"]))
    return kept

# Test PyMuPDF SVG decode
with open("public/samples/apex_biscuits.svg", "rb") as f:
    svg_bytes = f.read()

doc = fitz.open(stream=svg_bytes, filetype="svg")
page = doc[0]
pix = page.get_pixmap(dpi=300)
img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
if pix.n == 4:
    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
elif pix.n == 3:
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

print("Decoded SVG image dimensions:", img.shape)
reader = easyocr.Reader(['en'], gpu=False, verbose=False)

raw_results = reader.readtext(
    img,
    canvas_size=2560,
    mag_ratio=1.5,
    text_threshold=0.25,
    low_text=0.2,
    link_threshold=0.25,
    min_size=3
)

print("Raw results count:", len(raw_results))
regions = []
for poly, text, conf in raw_results:
    pts = np.array(poly, dtype=np.float64)
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
    regions.append({
        "text": text.strip(),
        "confidence": round(float(conf), 4),
        "boundingBox": bbox,
        "polygon": [[round(float(p[0]), 2), round(float(p[1]), 2)] for p in pts]
    })

dedup = deduplicate_regions(regions)
print(f"Deduplicated region count: {len(dedup)}")
for r in dedup:
    print(f"  [{r['confidence']}] {r['text']}")
