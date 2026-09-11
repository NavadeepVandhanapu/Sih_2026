# Legal Metrology Compliance & Enforcement Platform (SIH26034)

> **Smart India Hackathon 2026 — Problem Statement SIH26034**  
> **Title:** Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.  
> **Ministry:** Ministry of Consumer Affairs, Food & Public Distribution  
> **Department:** Department of Consumer Affairs (DoCA)  

---

## 1. Overview & Vision

**METROLOGIX AI** is an AI-assisted compliance screening, grievance redressal, and enforcement-support ecosystem connecting **Consumers**, **Manufacturers/Packers**, and **Government Legal Metrology Officers**.

The platform operates on the core philosophy:
> **SCAN → EXTRACT → VALIDATE → EXPLAIN → REPORT → RESOLVE → ESCALATE → ENFORCE**

### Fundamental Statutory Principle
The AI engine functions strictly as an **evidence-driven screening assistant**. Under the Legal Metrology Act, 2009, AI findings are flagged as **Potential Non-Compliance** or **Requires Verification**; only an authorized **Government Legal Metrology Officer** can formally adjudicate and declare a **Verified Violation**.

---

## 2. Three Role-Based Stakeholder Portals

| Portal | Role | Primary Capabilities |
|---|---|---|
| **Consumer Portal** (`/consumer`) | Citizen Consumer | Snap/upload packaged goods, progressive scan animation, inspect detected declarations & font sizes, raise evidence-backed grievance (`LM-2026-XXXXXX`), track timeline. |
| **Company Portal** (`/company`) | Packaging & Quality Head | View compliance rate, active grievances, investigate consumer proof, submit corrective response & revised artwork, and use **Pre-Launch Packaging Simulator** for preventive compliance. |
| **Government Portal** (`/government`) | Legal Metrology Officer | National Enforcement Command Center, Recharts violation analytics by rule & category, high-risk company matrix (0-100), human-in-the-loop verification workbench, order field audits, generate official PDF inspection reports. |
| **Admin Portal** (`/admin`) | Controller / Director | Versioned Legal Metrology Rule Registry (`v2026.1`) and immutable audit event ledger for non-repudiation. |

---

## 3. Seeded Demo Accounts

Use the **Role Switcher** in the top navigation bar for 1-click live demo switching, or login with:

| Stakeholder | Demo Email | Password | Role / Details |
|---|---|---|---|
| **Consumer** | `consumer@demo.com` | `demo123` | Aarav Sharma (Citizen Consumer) |
| **Company** | `company@demo.com` | `demo123` | Rajesh Verma (VP Regulatory, Apex Foods Pvt Ltd) |
| **Government Officer** | `officer@demo.com` | `demo123` | Sunita Meena, IO-LM (Legal Metrology Inspector) |
| **Admin / Controller** | `admin@demo.com` | `demo123` | Dr. K. R. Nambiar (Joint Secretary & LM Director) |

---

## 4. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React icons, Recharts, Canvas Confetti.
- **Backend:** Node.js, Fastify, TypeScript, `@fastify/multipart`, `@fastify/static`, `@fastify/cors`.
- **Database & ORM:** Drizzle ORM with SQLite (`better-sqlite3`) for instant, zero-friction local execution (interchangeable with PostgreSQL via `DATABASE_URL`).
- **Compliance & Rule Engine:** Modular `@sih/compliance-engine` evaluating mandatory Rule 6 declarations (MRP, Net Quantity, Mfg Date, Consumer Care, USP) and Rule 7/8 minimum character height calibration tables.
- **Report Generation:** `PDFKit` generating formal Government Legal Metrology Inspection & Compliance PDF dossiers with statutory disclaimers.

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js >= 18.0.0 (tested on v22.19.0)
- npm >= 9.0.0

### Run the Application
From the workspace root:

```bash
# 1. Install dependencies across workspaces
npm install

# 2. Seed database with companies, products, scans, and complaints
npm run seed

# 3. Launch both Fastify API server and Vite Web App concurrently
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:3001](http://localhost:3001)

---

## 6. End-to-End Demo Workflow for Hackathon Judges

1. **Consumer Scan (`/consumer`):**
   - Click preset **"Apex Biscuits"** (or upload your own packaged commodity photo).
   - Enter/adjust package dimensions (e.g., 160mm × 100mm) for physical font-size calibration.
   - Click **"Run AI Compliance Analysis"** and observe the real-time progressive scanning pipeline.
   - Inspect the extracted declarations (MRP, Net Qty 200g, Mfg Date 07/2026). Note that **Consumer Care Details** is flagged ❌ and font size is ⚠️ 1.7mm (under 2.0mm threshold).
   - Click **"View Evidence"** to inspect the highlighted bounding area and model confidence.
   - Click **"Raise Grievance"** to file complaint `LM-2026-XXXXXX` with auto-attached image proof.

2. **Company Grievance & Preventive Self-Check (`/company`):**
   - Switch role to **"Company (Apex Foods)"** using the top navigation bar.
   - Open the grievance docket, view consumer allegation and original image.
   - Submit an official corrective action (`PACKAGING_REVISION`) and attach revised artwork.
   - Visit **"Preventive Self-Check"** (`/company/self-check`) and test **"Corrected Artwork v2"** to verify that compliance jumps to 98% with all statutory declarations present.

3. **Government Officer Review & Adjudication (`/government`):**
   - Switch role to **"Legal Metrology Officer"**.
   - Inspect the **Command Center** charts (Violations by Rule, Violations by Category, High-Risk Watchlist).
   - Open the **Verification Queue** (`/government/complaints`), select the escalated complaint docket.
   - Review AI findings side-by-side with the company's reply.
   - Click **"Mark Verified Violation"** and issue statutory compounding notice under Section 36(1).
   - Click **"Official Compliance Report (PDF)"** to download the generated legal report.
   - Visit **"Inspections"** to schedule an on-site warehouse audit.

---

## 7. Statutory References Enforced
- **Rule 6(1)(a):** Name & address of the manufacturer/packer/importer.
- **Rule 6(1)(c) & Rule 12:** Net quantity in standard metric units.
- **Rule 6(1)(d):** Month and year of manufacture or pre-packing.
- **Rule 6(1)(e):** Maximum Retail Price (MRP) inclusive of all taxes.
- **Rule 6(1)(n) & Rule 6(2):** Consumer care phone, email, and grievance address.
- **Rule 6(11):** Unit Sale Price (USP) per g/ml/kg/L.
- **Rule 7 & 8:** Minimum numeral and letter font heights (1mm / 2mm / 4mm / 6mm based on net quantity).
