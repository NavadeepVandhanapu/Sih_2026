import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlitePath = path.join(dbDir, 'legal_metrology.db');
const sqlite = new Database(sqlitePath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

/**
 * Initialize all tables if not already present
 */
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      company_id TEXT,
      phone TEXT,
      designation TEXT,
      department TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration_no TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      risk_score INTEGER NOT NULL DEFAULT 20,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      address TEXT NOT NULL,
      state TEXT NOT NULL,
      compliance_rate INTEGER NOT NULL DEFAULT 90,
      active_complaints_count INTEGER NOT NULL DEFAULT 0,
      total_products_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      barcode TEXT,
      standard_net_quantity TEXT,
      standard_mrp TEXT,
      total_scans INTEGER NOT NULL DEFAULT 0,
      potential_issues_count INTEGER NOT NULL DEFAULT 0,
      verified_violations_count INTEGER NOT NULL DEFAULT 0,
      compliance_status TEXT NOT NULL DEFAULT 'COMPLIANT',
      sample_image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT,
      image_path TEXT NOT NULL,
      original_file_name TEXT,
      status TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      rule_set_version TEXT NOT NULL,
      ocr_text TEXT NOT NULL,
      ocr_confidence REAL NOT NULL,
      font_analysis_json TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      brand_detected TEXT,
      product_name_detected TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS declarations (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      declaration_type TEXT NOT NULL,
      label TEXT NOT NULL,
      detected_value TEXT,
      confidence REAL NOT NULL,
      raw_snippet TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS rule_evaluations (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      section_reference TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL NOT NULL,
      detected_value TEXT,
      expected_requirement TEXT NOT NULL,
      explanation TEXT NOT NULL,
      evidence_snippet TEXT
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      consumer_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      product_id TEXT,
      status TEXT NOT NULL,
      consumer_notes TEXT,
      consumer_location TEXT,
      purchase_store TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS company_responses (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      corrective_action_type TEXT,
      corrected_label_image_url TEXT,
      batch_number TEXT,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS government_reviews (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      officer_id TEXT NOT NULL,
      officer_name TEXT NOT NULL,
      decision TEXT NOT NULL,
      officer_notes TEXT NOT NULL,
      penalty_notice_section TEXT,
      penalty_amount REAL,
      review_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      complaint_id TEXT,
      company_id TEXT NOT NULL,
      assigned_officer_id TEXT NOT NULL,
      assigned_officer_name TEXT NOT NULL,
      facility_address TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL,
      findings_summary TEXT,
      enforcement_action TEXT,
      report_pdf_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details_json TEXT,
      timestamp TEXT NOT NULL
    );
  `);
}
