import os
import requests
import json
import glob

url = "http://127.0.0.1:8000/ocr"
uploads_dir = "apps/api/uploads"
files = glob.glob(os.path.join(uploads_dir, "scan_*.*"))

print(f"Found {len(files)} scan files in {uploads_dir}:")

for fpath in sorted(files):
    print("\n" + "="*70)
    print(f"FILE: {fpath}")
    print("="*70)
    
    with open(fpath, "rb") as f:
        mimetype = "image/jpeg" if fpath.endswith((".jpeg", ".jpg")) else "image/webp"
        res = requests.post(url, files={"file": (os.path.basename(fpath), f, mimetype)})
    
    if res.status_code != 200:
        print(f"HTTP Error {res.status_code}: {res.text}")
        continue
        
    data = res.json()
    print("Success:", data.get("success"))
    print("Engine:", data.get("provider"))
    print("Image Dimensions:", data.get("image"))
    print("Quality Metrics:", json.dumps(data.get("quality"), indent=2))
    
    regions = data.get("regions", [])
    print(f"\nDetected Regions Count: {len(regions)}")
    print("-"*70)
    for idx, r in enumerate(regions):
        print(f"Region #{idx+1:02d} | Conf: {r['confidence']:.4f} | BBox: {r['boundingBox']} | Text: '{r['text']}'")
    print("="*70)
