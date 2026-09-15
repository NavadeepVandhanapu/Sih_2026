import {
  DeclarationType,
  ExtractedDeclaration,
  OCRRegion,
  BoundingBox,
  NormalizedMRP,
  NormalizedNetQuantity,
  NormalizedMfgDate,
  NormalizedConsumerCare,
  NormalizedUnitSalePrice,
  NormalizedCountryOfOrigin,
} from '../types';

export class DeclarationExtractor {
  public static extract(
    rawText: string,
    ocrRegions?: OCRRegion[]
  ): Record<DeclarationType, ExtractedDeclaration> {
    const text = rawText || '';

    const decs: Record<DeclarationType, ExtractedDeclaration> = {
      manufacturer: this.extractManufacturer(text),
      packer_importer: this.extractPackerImporter(text),
      net_quantity: this.extractNetQuantity(text),
      mrp: this.extractMRP(text),
      mfg_date: this.extractMfgDate(text),
      consumer_care: this.extractConsumerCare(text),
      unit_sale_price: this.extractUnitSalePrice(text),
      country_of_origin: this.extractCountryOfOrigin(text),
    };

    // Attach multi-region bounding boxes and derive overall evidence confidence if regions available
    if (ocrRegions && ocrRegions.length > 0) {
      for (const [key, dec] of Object.entries(decs) as Array<[DeclarationType, ExtractedDeclaration]>) {
        if (dec.detectedValue || dec.rawSnippet) {
          const matchedRegions = this.findMatchingRegions(dec, ocrRegions);
          if (matchedRegions.length > 0) {
            dec.evidenceRegions = matchedRegions.map((r) => r.boundingBox);
            dec.boundingBox = matchedRegions[0].boundingBox;

            const avgOcrConf =
              matchedRegions.reduce((sum, r) => sum + r.confidence, 0) / matchedRegions.length;
            dec.ocrConfidence = Math.round(avgOcrConf * 100) / 100;

            const patternConf = dec.extractionConfidence || dec.confidence;
            dec.overallConfidence = Math.round((dec.ocrConfidence * 0.4 + patternConf * 0.6) * 100) / 100;
            dec.confidence = dec.overallConfidence;
          }
        }
      }
    }

    return decs;
  }

  private static findMatchingRegions(
    dec: ExtractedDeclaration,
    regions: OCRRegion[]
  ): OCRRegion[] {
    const target = (dec.rawSnippet || dec.detectedValue || '').toLowerCase();
    if (!target) return [];

    const matched: OCRRegion[] = [];
    const tokens = target.split(/\s+/).filter((w) => w.length >= 2);

    for (const r of regions) {
      const regionText = r.text.toLowerCase();
      if (regionText.includes(target) || target.includes(regionText)) {
        matched.push(r);
        continue;
      }
      const tokenMatches = tokens.filter((t) => regionText.includes(t));
      if (tokenMatches.length >= 2 || (tokens.length === 1 && tokenMatches.length === 1)) {
        matched.push(r);
      }
    }

    return matched;
  }

  private static extractManufacturer(text: string): ExtractedDeclaration {
    const mfgRegex = /(?:Manufactured(?:\s*&\s*Packed)?|Mfd|Mfg|Produced|Packed|Marketed)\s*(?:by|at)?\s*[:\-]?\s*([A-Za-z0-9\s,\.\-&]+(?:Pvt\.?\s*Ltd\.?|Limited|LLP|Enterprises|Foods|Industries)?(?:\n[A-Za-z0-9\s,\.\-]+)?)/i;
    const match = text.match(mfgRegex);

    if (match && match[1] && match[1].trim().length > 3) {
      const cleanVal = match[1].split('\n')[0].replace(/,\s*$/, '').trim();
      return {
        type: 'manufacturer',
        label: 'Manufacturer Name & Address',
        detectedValue: cleanVal,
        rawText: text,
        rawSnippet: match[0].trim(),
        extractionConfidence: 0.94,
        confidence: 0.94,
        notes: 'Manufacturer statement identified with legal premise details',
      };
    }

    const fallbackRegex = /([A-Z][A-Za-z0-9\s&]{2,30}(?:Pvt\.?\s*Ltd|Limited|Industries|Herbals|Foods))/;
    const fallbackMatch = text.match(fallbackRegex);
    if (fallbackMatch) {
      return {
        type: 'manufacturer',
        label: 'Manufacturer Name & Address',
        detectedValue: fallbackMatch[1].trim(),
        rawText: text,
        rawSnippet: fallbackMatch[0],
        extractionConfidence: 0.72,
        confidence: 0.72,
        notes: 'Identified probable corporate name; full premise address requires manual verification',
      };
    }

    return {
      type: 'manufacturer',
      label: 'Manufacturer Name & Address',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.25,
      confidence: 0.25,
      notes: 'No explicit "Manufactured by" declaration confidently located',
    };
  }

  private static extractPackerImporter(text: string): ExtractedDeclaration {
    const regex = /(?:Packed\s+by|Marketed\s+by|Imported\s+by|Packed\s*&\s*Marketed\s+by)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-&]+)/i;
    const match = text.match(regex);

    if (match && match[1]) {
      return {
        type: 'packer_importer',
        label: 'Packer / Marketer / Importer',
        detectedValue: match[1].trim().split('\n')[0],
        rawText: text,
        rawSnippet: match[0],
        extractionConfidence: 0.89,
        confidence: 0.89,
      };
    }

    return {
      type: 'packer_importer',
      label: 'Packer / Marketer / Importer',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.5,
      confidence: 0.5,
      notes: 'Combined or distinct packer details not found; verified under manufacturer rule if same',
    };
  }

  private static extractNetQuantity(text: string): ExtractedDeclaration {
    // Robust pattern matching metric units including noise variations and glued units (e.g. 250g, NET WT 250g)
    const netQtyRegex = /(?:Net\s*(?:Quantity|Qty|Weight|Wt\.?|Vol|Volume|Contents?)|NET\s*WT\.?)\s*[:\s\-]*\s*(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litres?|pieces?|N|u|units?))\b/i;
    let match = text.match(netQtyRegex);

    if (match && match[1]) {
      const rawVal = match[1].trim();
      const norm = this.normalizeNetQty(rawVal);
      return {
        type: 'net_quantity',
        label: 'Net Quantity',
        detectedValue: rawVal,
        rawText: text,
        rawSnippet: match[0],
        normalized: norm,
        extractionConfidence: 0.98,
        confidence: 0.98,
        notes: 'Standard metric quantity identified with unit',
      };
    }

    const bareMetricRegex = /\b(\d+(?:\.\d+)?\s*(?:kg|gms?|g|ml|ltr|litres?))\b/i;
    match = text.match(bareMetricRegex);
    if (match && match[1]) {
      const rawVal = match[1].trim();
      const norm = this.normalizeNetQty(rawVal);
      return {
        type: 'net_quantity',
        label: 'Net Quantity',
        detectedValue: rawVal,
        rawText: text,
        rawSnippet: match[0],
        normalized: norm,
        extractionConfidence: 0.78,
        confidence: 0.78,
        notes: 'Inferred metric declaration from numeric quantity pattern',
      };
    }

    return {
      type: 'net_quantity',
      label: 'Net Quantity',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.15,
      confidence: 0.15,
      notes: 'No net quantity statement detected',
    };
  }

  private static normalizeNetQty(valStr: string): NormalizedNetQuantity {
    const match = valStr.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (!match) {
      return {
        numericValue: null,
        unit: null,
        normalizedKgOrL: null,
        normalizedUnit: null,
        isStandardMetric: false,
      };
    }

    const num = parseFloat(match[1]);
    const rawUnit = match[2].toLowerCase();
    let normKgOrL: number | null = null;
    let normUnit: 'kg' | 'l' | 'g' | 'ml' | 'units' | null = null;

    if (['g', 'gm', 'gms'].includes(rawUnit)) {
      normKgOrL = num / 1000;
      normUnit = 'g';
    } else if (['kg'].includes(rawUnit)) {
      normKgOrL = num;
      normUnit = 'kg';
    } else if (['ml'].includes(rawUnit)) {
      normKgOrL = num / 1000;
      normUnit = 'ml';
    } else if (['l', 'ltr', 'litre', 'litres'].includes(rawUnit)) {
      normKgOrL = num;
      normUnit = 'l';
    } else if (['n', 'u', 'unit', 'units', 'piece', 'pieces'].includes(rawUnit)) {
      normUnit = 'units';
    }

    return {
      numericValue: num,
      unit: rawUnit,
      normalizedKgOrL: normKgOrL,
      normalizedUnit: normUnit,
      isStandardMetric: normUnit !== null,
    };
  }

  private static extractMRP(text: string): ExtractedDeclaration {
    // Robust pattern for MRP with noise tolerance (M.R.P., Max Retail Price, Rs, ₹, INR)
    const mrpRegex = /(?:M\.?R\.?P\.?|Maximum\s+Retail\s+Price)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*(\d+(?:\.\d{1,2})?)\s*([^\n\r]*incl[^\n\r]*)?/i;
    const match = text.match(mrpRegex);

    if (match && match[1]) {
      const priceStr = match[1].trim();
      const priceVal = parseFloat(priceStr);
      const taxPhrase = match[2] || '';
      const hasTaxMention = /incl|tax/i.test(taxPhrase) || /incl.*tax/i.test(text);

      const norm: NormalizedMRP = {
        numericValue: priceVal,
        currency: 'INR',
        taxInclusive: hasTaxMention,
        formattedDisplay: `₹${priceStr}${hasTaxMention ? ' (incl. of all taxes)' : ''}`,
      };

      return {
        type: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        detectedValue: norm.formattedDisplay,
        rawText: text,
        rawSnippet: match[0].trim(),
        normalized: norm,
        extractionConfidence: hasTaxMention ? 0.96 : 0.82,
        confidence: hasTaxMention ? 0.96 : 0.82,
        notes: hasTaxMention
          ? 'MRP detected with statutory inclusive tax notice'
          : 'MRP detected but tax inclusivity clause is unclear/missing',
      };
    }

    const fallbackPrice = /(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d{1,2})?)/i.exec(text);
    if (fallbackPrice) {
      const priceStr = fallbackPrice[1].trim();
      const priceVal = parseFloat(priceStr);
      const norm: NormalizedMRP = {
        numericValue: priceVal,
        currency: 'INR',
        taxInclusive: false,
        formattedDisplay: `₹${priceStr}`,
      };

      return {
        type: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        detectedValue: norm.formattedDisplay,
        rawText: text,
        rawSnippet: fallbackPrice[0],
        normalized: norm,
        extractionConfidence: 0.65,
        confidence: 0.65,
        notes: 'Price symbol found; formal MRP prefix needs verification',
      };
    }

    return {
      type: 'mrp',
      label: 'Maximum Retail Price (MRP)',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.1,
      confidence: 0.1,
      notes: 'No retail sale price declaration located',
    };
  }

  private static extractMfgDate(text: string): ExtractedDeclaration {
    const dateRegex = /(?:Mfg|Mfd|Packed|Pkd|Date\s*of\s*(?:Mfg|Packing))\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-]+[0-9]{2,4})/i;
    const match = text.match(dateRegex);

    if (match && match[1]) {
      const rawDateStr = match[1].trim();
      const norm = this.normalizeMfgDate(rawDateStr);

      return {
        type: 'mfg_date',
        label: 'Month & Year of Manufacture/Packing',
        detectedValue: rawDateStr,
        rawText: text,
        rawSnippet: match[0],
        normalized: norm,
        extractionConfidence: 0.95,
        confidence: 0.95,
        notes: 'Standard month/year packaging date format detected',
      };
    }

    const bareDate = /\b(0[1-9]|1[0-2])[\/\-](202[4-8])\b/.exec(text);
    if (bareDate) {
      const rawDateStr = bareDate[0];
      const norm = this.normalizeMfgDate(rawDateStr);

      return {
        type: 'mfg_date',
        label: 'Month & Year of Manufacture/Packing',
        detectedValue: rawDateStr,
        rawText: text,
        rawSnippet: bareDate[0],
        normalized: norm,
        extractionConfidence: 0.74,
        confidence: 0.74,
        notes: 'Date pattern detected; verify if manufacturing or expiry',
      };
    }

    return {
      type: 'mfg_date',
      label: 'Month & Year of Manufacture/Packing',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.2,
      confidence: 0.2,
      notes: 'Packaging or manufacturing date not detected',
    };
  }

  private static normalizeMfgDate(dateStr: string): NormalizedMfgDate {
    const parts = dateStr.split(/[\/\-\s\.]+/);
    let month: number | null = null;
    let year: number | null = null;

    if (parts.length >= 2) {
      if (/^\d+$/.test(parts[0])) {
        month = parseInt(parts[0], 10);
      }
      if (/^\d+$/.test(parts[parts.length - 1])) {
        year = parseInt(parts[parts.length - 1], 10);
        if (year < 100) year += 2000;
      }
    }

    return {
      month,
      year,
      rawFormat: dateStr,
      isoDateString: year && month ? `${year}-${String(month).padStart(2, '0')}-01` : null,
    };
  }

  private static extractConsumerCare(text: string): ExtractedDeclaration {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const phoneRegex = /(?:1800[\s\-]?\d{3}[\s\-]?\d{3,4}|(?:\+?91[\s\-]?)?[6-9]\d{9}|\b0\d{2,4}[\s\-]?\d{6,8}\b)/;
    const careKeywordRegex = /(?:Consumer\s*Care|Customer\s*Care|Toll\s*Free|Call|Feedback|Queries|Grievance|Contact\s*Us)/i;

    const hasCareKeyword = careKeywordRegex.test(text);
    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);

    if (emailMatch || phoneMatch || hasCareKeyword) {
      const email = emailMatch ? emailMatch[0] : null;
      const phone = phoneMatch ? phoneMatch[0] : null;

      const parts: string[] = [];
      if (email) parts.push(`Email: ${email}`);
      if (phone) parts.push(`Tel: ${phone}`);

      const norm: NormalizedConsumerCare = {
        email,
        phone,
        address: null,
        hasMultiChannel: !!(email && phone),
      };

      if (parts.length > 0) {
        return {
          type: 'consumer_care',
          label: 'Consumer Care Details',
          detectedValue: parts.join(' | '),
          rawText: text,
          rawSnippet: parts.join(', '),
          normalized: norm,
          extractionConfidence: email && phone ? 0.97 : 0.86,
          confidence: email && phone ? 0.97 : 0.86,
          notes: 'Consumer care contact channel(s) detected',
        };
      }

      // Keyword found without specific email/phone pattern match
      const keywordSnippet = text.match(/(?:Consumer\s*Care|Customer\s*Care|Toll\s*Free)[^\n\r]{0,60}/i);
      if (keywordSnippet) {
        return {
          type: 'consumer_care',
          label: 'Consumer Care Details',
          detectedValue: keywordSnippet[0].trim(),
          rawText: text,
          rawSnippet: keywordSnippet[0].trim(),
          normalized: norm,
          extractionConfidence: 0.75,
          confidence: 0.75,
          notes: 'Consumer care notice section located; detailed contact numbers require manual check',
        };
      }
    }

    return {
      type: 'consumer_care',
      label: 'Consumer Care Details',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.15,
      confidence: 0.15,
      notes: 'No consumer care email, toll-free number, or grievance desk detected',
    };
  }

  private static extractUnitSalePrice(text: string): ExtractedDeclaration {
    const uspRegex = /(?:Unit\s*Sale\s*Price|USP)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{1,4})?)\s*(?:per|\/)\s*(g|gm|kg|ml|l|meter|metre|u)/i;
    const match = text.match(uspRegex);

    if (match && match[1] && match[2]) {
      const priceStr = match[1].trim();
      const price = parseFloat(priceStr);
      const unit = match[2];
      const norm: NormalizedUnitSalePrice = {
        pricePerUnit: price,
        unit,
        formattedDisplay: `₹${priceStr} / ${unit}`,
      };

      return {
        type: 'unit_sale_price',
        label: 'Unit Sale Price (USP)',
        detectedValue: norm.formattedDisplay,
        rawText: text,
        rawSnippet: match[0],
        normalized: norm,
        extractionConfidence: 0.93,
        confidence: 0.93,
        notes: 'Statutory unit sale price declared with unit quotient',
      };
    }

    return {
      type: 'unit_sale_price',
      label: 'Unit Sale Price (USP)',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.4,
      confidence: 0.4,
      notes: 'No dedicated unit sale price declaration detected',
    };
  }

  private static extractCountryOfOrigin(text: string): ExtractedDeclaration {
    const originRegex = /(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z\s]+)/i;
    const match = text.match(originRegex);

    if (match && match[1]) {
      const country = match[1].split('\n')[0].replace(/^in\s+/i, '').replace(/[\.,].*$/, '').trim();
      const norm: NormalizedCountryOfOrigin = {
        country,
        isDomestic: /^India$/i.test(country),
      };

      return {
        type: 'country_of_origin',
        label: 'Country of Origin',
        detectedValue: country,
        rawText: text,
        rawSnippet: match[0],
        normalized: norm,
        extractionConfidence: 0.92,
        confidence: 0.92,
      };
    }

    if (/India|New\s*Delhi|Mumbai|Bengaluru|Chennai|Kolkata|Pune|Gujarat|Maharashtra/i.test(text)) {
      const norm: NormalizedCountryOfOrigin = {
        country: 'India',
        isDomestic: true,
      };

      return {
        type: 'country_of_origin',
        label: 'Country of Origin',
        detectedValue: 'India (Inferred from domestic premise address)',
        rawText: text,
        normalized: norm,
        extractionConfidence: 0.75,
        confidence: 0.75,
      };
    }

    return {
      type: 'country_of_origin',
      label: 'Country of Origin',
      detectedValue: null,
      rawText: text,
      extractionConfidence: 0.3,
      confidence: 0.3,
      notes: 'Country of origin not explicitly stated',
    };
  }
}
