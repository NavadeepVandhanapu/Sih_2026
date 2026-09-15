import requests
import json

url = "http://127.0.0.1:8000/ocr"
image_path = "apps/api/uploads/scan_1789138571306_bb88c05af9657e5f.webp"

with open(image_path, "rb") as f:
    files = {"file": ("scan.webp", f, "image/webp")}
    res = requests.post(url, files=files)

print("Status Code:", res.status_code)
data = res.json()
print("Success:", data.get("success"))
print("Image Dimensions:", data.get("image"))
print("Quality Metrics:", data.get("quality"))
print("Regions Detected Count:", len(data.get("regions", [])))
if data.get("regions"):
    print("First 3 Regions:")
    for r in data.get("regions")[:3]:
        print("  - Text:", r["text"], "| Conf:", r["confidence"], "| BBox:", r["boundingBox"])
