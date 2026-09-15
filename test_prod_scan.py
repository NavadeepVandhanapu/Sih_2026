import requests
import json

url = "http://localhost:3001/api/scans/analyze"

payload = {
    "imageUrl": "/samples/apex_biscuits.svg",
    "packageHeightMm": 160,
    "packageWidthMm": 100
}

# Login first with seeded credentials
auth_res = requests.post("http://localhost:3001/api/auth/login", json={"email": "consumer@demo.com", "password": "demo123"})
print("Auth status:", auth_res.status_code)
token = auth_res.json().get("token")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
res = requests.post(url, json=payload, headers=headers)

print("Scan API status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Scan ID:", data.get("scanId"))
    print("Overall Status:", data["analysis"]["summary"]["overallStatus"])
    print("Score:", data["analysis"]["summary"]["score"], "%")
    print("AI Confidence:", data["analysis"]["summary"]["aiConfidence"], "%")
    print("OCR Regions Count:", len(data["analysis"]["ocrRegions"]))
    
    print("\nExtracted Declarations:")
    for key, dec in data["analysis"]["declarations"].items():
        print(f"  - {dec['label']}: {dec['detectedValue']} (Conf: {dec['confidence']})")
        
    print("\nRule Evaluation Results:")
    for r in data["analysis"]["ruleResults"]:
        print(f"  [{r['status']}] {r['ruleName']}: {r['detectedValue'] or 'NOT LOCATED'} -> {r['explanation']}")
