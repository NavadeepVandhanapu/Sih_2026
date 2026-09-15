import path from 'node:path';

export class InputValidator {
  public static isValidEmail(email: unknown): email is string {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  public static sanitizeFilename(filename: string): string {
    // Strip path traversal sequences like ../ or ..\
    const basename = path.basename(filename);
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  public static validateUploadFile(file: { filename: string; mimetype: string; size?: number }): { valid: boolean; error?: string } {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported file type '${file.mimetype}'. Permitted formats: JPG, PNG, WEBP, SVG.`,
      };
    }

    if (file.size && file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
      };
    }

    return { valid: true };
  }

  public static validateComplaintPayload(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a valid JSON object' };
    }
    if (!body.scanId || typeof body.scanId !== 'string' || body.scanId.trim().length === 0) {
      return { valid: false, error: 'scanId is mandatory and must be a string' };
    }
    return { valid: true };
  }

  public static validateCompanyResponsePayload(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a valid JSON object' };
    }
    if (!body.responseText || typeof body.responseText !== 'string' || body.responseText.trim().length < 5) {
      return { valid: false, error: 'responseText must be at least 5 characters long' };
    }
    const validActions = ['PACKAGING_REVISION', 'RECALL_BATCH', 'INTERNAL_AUDIT', 'DISPUTED'];
    if (body.correctiveActionType && !validActions.includes(body.correctiveActionType)) {
      return { valid: false, error: `Invalid correctiveActionType. Must be one of: ${validActions.join(', ')}` };
    }
    return { valid: true };
  }

  public static validateGovernmentVerifyPayload(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a valid JSON object' };
    }
    const validDecisions = ['VERIFIED_VIOLATION', 'REJECTED', 'INSPECTION_ORDERED', 'REQUEST_MORE_EVIDENCE'];
    if (!body.decision || !validDecisions.includes(body.decision)) {
      return { valid: false, error: `Invalid officer decision. Must be one of: ${validDecisions.join(', ')}` };
    }
    if (!body.officerNotes || typeof body.officerNotes !== 'string' || body.officerNotes.trim().length < 5) {
      return { valid: false, error: 'officerNotes must be at least 5 characters long' };
    }
    if (body.penaltyAmount !== undefined && (typeof body.penaltyAmount !== 'number' || body.penaltyAmount < 0)) {
      return { valid: false, error: 'penaltyAmount must be a non-negative number' };
    }
    return { valid: true };
  }

  public static validateInspectionPayload(body: any): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Request body must be a valid JSON object' };
    }
    if (!body.companyId || typeof body.companyId !== 'string') {
      return { valid: false, error: 'companyId is required' };
    }
    if (!body.facilityAddress || typeof body.facilityAddress !== 'string' || body.facilityAddress.trim().length < 5) {
      return { valid: false, error: 'facilityAddress is required and must be a string' };
    }
    return { valid: true };
  }
}
