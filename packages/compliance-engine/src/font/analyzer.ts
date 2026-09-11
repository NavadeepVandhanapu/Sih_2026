import { FontAnalysisResult, RuleStatus } from '../types';

export interface FontCalibrationParams {
  netQtyString?: string | null;
  packageHeightMm?: number;
  packageWidthMm?: number;
  imageHeightPx?: number;
  imageWidthPx?: number;
  measuredCharHeightPx?: number;
}

export class FontAnalyzer {
  /**
   * Determine minimum statutory height required by Rule 7 & 8 Legal Metrology PC Rules
   */
  public static getRequiredMinimumMm(netQtyString?: string | null): number {
    if (!netQtyString) return 2.0; // Default baseline

    const match = netQtyString.match(/(\d+(?:\.\d+)?)\s*(g|gm|kg|ml|l|ltr)/i);
    if (!match) return 2.0;

    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Convert to normalized grams or milliliters
    let normalized = val;
    if (unit === 'kg' || unit === 'l' || unit === 'ltr') {
      normalized = val * 1000;
    }

    if (normalized <= 50) {
      return 1.0;
    } else if (normalized <= 200) {
      return 2.0;
    } else if (normalized <= 1000) {
      return 4.0;
    } else {
      return 6.0;
    }
  }

  /**
   * Analyze character readability and physical font size estimate
   */
  public static analyze(params: FontCalibrationParams): FontAnalysisResult {
    const requiredMin = this.getRequiredMinimumMm(params.netQtyString);

    let estimatedMm = 0;
    let method: 'user_dimensions' | 'reference_marker' | 'estimated_dpi' = 'estimated_dpi';
    let confidence = 0.72;

    if (
      params.packageHeightMm &&
      params.imageHeightPx &&
      params.measuredCharHeightPx &&
      params.imageHeightPx > 0
    ) {
      // Physical scale formula:
      // (Char Height in Px / Image Height in Px) * Physical Package Height in mm
      estimatedMm = parseFloat(
        ((params.measuredCharHeightPx / params.imageHeightPx) * params.packageHeightMm).toFixed(2)
      );
      method = 'user_dimensions';
      confidence = 0.88;
    } else {
      // Default optical estimation: typical mobile camera label capture (at ~20cm)
      // gives ~7-9 px per mm on standard 1080p label crop
      const measuredPx = params.measuredCharHeightPx || 22; // default detected letter pixel height
      const estimatedPxPerMm = 9.5;
      estimatedMm = parseFloat((measuredPx / estimatedPxPerMm).toFixed(2));
      confidence = 0.70;
    }

    let status: RuleStatus = 'COMPLIANT';
    let explanation = '';

    if (estimatedMm < requiredMin * 0.85) {
      // Significantly below required statutory minimum
      status = 'POTENTIAL_NON_COMPLIANCE';
      explanation = `Estimated character height (${estimatedMm} mm) is below the statutory minimum of ${requiredMin} mm prescribed under Rule 7/8 for net quantity ${params.netQtyString || 'specified'}.`;
    } else if (estimatedMm < requiredMin) {
      // Borderline
      status = 'MANUAL_REVIEW_RECOMMENDED';
      explanation = `Estimated character height (${estimatedMm} mm) is borderline compared to the required ${requiredMin} mm. Optical calibration uncertainty suggests physical verification by an enforcement officer.`;
    } else {
      status = 'COMPLIANT';
      explanation = `Estimated character height (${estimatedMm} mm) meets or exceeds the required threshold of ${requiredMin} mm.`;
    }

    return {
      estimatedCharHeightMm: estimatedMm,
      requiredMinimumMm: requiredMin,
      calibrationMethod: method,
      packageHeightMm: params.packageHeightMm,
      packageWidthMm: params.packageWidthMm,
      status,
      confidence,
      explanation,
    };
  }
}
