import { DeclarationType, ExtractedDeclaration } from '../types';

export class DeclarationExtractor {
  public static extract(rawText: string): Record<DeclarationType, ExtractedDeclaration> {
    const text = rawText || '';

    return {
      manufacturer: this.extractManufacturer(text),
      packer_importer: this.extractPackerImporter(text),
      net_quantity: this.extractNetQuantity(text),
      mrp: this.extractMRP(text),
      mfg_date: this.extractMfgDate(text),
      consumer_care: this.extractConsumerCare(text),
      unit_sale_price: this.extractUnitSalePrice(text),
      country_of_origin: this.extractCountryOfOrigin(text),
    };
  }

  private static extractManufacturer(text: string): ExtractedDeclaration {
    // Look for keywords: "Mfd by", "Manufactured by", "Mfg by", "Produced by"
    const mfgRegex = /(?:Manufactured|Mfd|Produced|Packed)\s+by\s*[:\-]?\s*([A-Za-z0-9\s,\.\-&]+(?:Pvt\.?\s*Ltd\.?|Limited|LLP|Enterprises|Foods|Industries)?(?:\n[A-Za-z0-9\s,\.\-]+)?)/i;
    const match = text.match(mfgRegex);

    if (match && match[1] && match[1].trim().length > 3) {
      const cleanVal = match[1].split('\n')[0].replace(/,\s*$/, '').trim();
      return {
        type: 'manufacturer',
        label: 'Manufacturer Name & Address',
        detectedValue: cleanVal,
        confidence: 0.94,
        rawSnippet: match[0].trim(),
        notes: 'Manufacturer statement identified with postal identifier',
      };
    }

    // Secondary scan for company names
    const fallbackRegex = /([A-Z][A-Za-z0-9\s&]{2,30}(?:Pvt\.?\s*Ltd|Limited|Industries|Herbals|Foods))/;
    const fallbackMatch = text.match(fallbackRegex);
    if (fallbackMatch) {
      return {
        type: 'manufacturer',
        label: 'Manufacturer Name & Address',
        detectedValue: fallbackMatch[1].trim(),
        confidence: 0.72,
        rawSnippet: fallbackMatch[0],
        notes: 'Identified probable corporate name; full premise address requires manual verification',
      };
    }

    return {
      type: 'manufacturer',
      label: 'Manufacturer Name & Address',
      detectedValue: null,
      confidence: 0.25,
      notes: 'No explicit "Manufactured by" declaration confidently located',
    };
  }

  private static extractPackerImporter(text: string): ExtractedDeclaration {
    const regex = /(?:Packed\s+by|Marketed\s+by|Imported\s+by)\s*[:\-]?\s*([A-Za-z0-9\s,\.\-&]+)/i;
    const match = text.match(regex);

    if (match && match[1]) {
      return {
        type: 'packer_importer',
        label: 'Packer / Marketer / Importer',
        detectedValue: match[1].trim().split('\n')[0],
        confidence: 0.89,
        rawSnippet: match[0],
      };
    }

    return {
      type: 'packer_importer',
      label: 'Packer / Marketer / Importer',
      detectedValue: null,
      confidence: 0.5,
      notes: 'Combined or distinct packer details not found; verified under manufacturer rule if same',
    };
  }

  private static extractNetQuantity(text: string): ExtractedDeclaration {
    // Look for "Net Qty", "Net Wt", "Net Content", "Net Quantity"
    const netQtyRegex = /(?:Net\s*(?:Quantity|Qty|Weight|Wt|Vol|Volume|Contents?)[:\s\-]*)\s*(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litres?|pieces?|N|u|units?))\b/i;
    let match = text.match(netQtyRegex);

    if (match && match[1]) {
      return {
        type: 'net_quantity',
        label: 'Net Quantity',
        detectedValue: match[1].trim(),
        confidence: 0.98,
        rawSnippet: match[0],
        notes: 'Standard metric quantity identified with unit',
      };
    }

    // Bare weight regex like "200 g" or "500 ml" or "1 kg"
    const bareMetricRegex = /\b(\d+(?:\.\d+)?\s*(?:kg|gms?|ml|ltr|litres?))\b/i;
    match = text.match(bareMetricRegex);
    if (match && match[1]) {
      return {
        type: 'net_quantity',
        label: 'Net Quantity',
        detectedValue: match[1].trim(),
        confidence: 0.78,
        rawSnippet: match[0],
        notes: 'Inferred metric declaration from numeric quantity pattern',
      };
    }

    return {
      type: 'net_quantity',
      label: 'Net Quantity',
      detectedValue: null,
      confidence: 0.15,
      notes: 'No net quantity statement detected',
    };
  }

  private static extractMRP(text: string): ExtractedDeclaration {
    // Look for MRP: "MRP Rs. 50", "M.R.P. : ₹ 120.00 (incl. of all taxes)"
    const mrpRegex = /(?:M\.?R\.?P\.?|Maximum\s+Retail\s+Price)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*(\d+(?:\.\d{2})?)\s*([^\n\r]*incl[^\n\r]*)?/i;
    const match = text.match(mrpRegex);

    if (match && match[1]) {
      const price = match[1].trim();
      const taxPhrase = match[2] || '';
      const hasTaxMention = /incl|tax/i.test(taxPhrase) || /incl.*tax/i.test(text);

      return {
        type: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        detectedValue: `₹${price}${hasTaxMention ? ' (incl. of all taxes)' : ''}`,
        confidence: hasTaxMention ? 0.96 : 0.82,
        rawSnippet: match[0].trim(),
        notes: hasTaxMention
          ? 'MRP detected with statutory inclusive tax notice'
          : 'MRP detected but tax inclusivity clause is unclear/missing',
      };
    }

    // Currency pattern fallback
    const fallbackPrice = /(?:₹|Rs\.?)\s*(\d+(?:\.\d{2})?)/i.exec(text);
    if (fallbackPrice) {
      return {
        type: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        detectedValue: `₹${fallbackPrice[1]}`,
        confidence: 0.65,
        rawSnippet: fallbackPrice[0],
        notes: 'Price symbol found; formal MRP prefix needs verification',
      };
    }

    return {
      type: 'mrp',
      label: 'Maximum Retail Price (MRP)',
      detectedValue: null,
      confidence: 0.1,
      notes: 'No retail sale price declaration located',
    };
  }

  private static extractMfgDate(text: string): ExtractedDeclaration {
    // "Mfg Date: 05/2026", "Pkd: MAY 2026", "Mfd: 12/2025"
    const dateRegex = /(?:Mfg|Mfd|Packed|Pkd|Date\s*of\s*(?:Mfg|Packing))\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\.\-]+[0-9]{2,4})/i;
    const match = text.match(dateRegex);

    if (match && match[1]) {
      return {
        type: 'mfg_date',
        label: 'Month & Year of Manufacture/Packing',
        detectedValue: match[1].trim(),
        confidence: 0.95,
        rawSnippet: match[0],
        notes: 'Standard month/year packaging date format detected',
      };
    }

    // Secondary date search
    const bareDate = /\b(0[1-9]|1[0-2])[\/\-](202[4-8])\b/.exec(text);
    if (bareDate) {
      return {
        type: 'mfg_date',
        label: 'Month & Year of Manufacture/Packing',
        detectedValue: bareDate[0],
        confidence: 0.74,
        rawSnippet: bareDate[0],
        notes: 'Date pattern detected; verify if manufacturing or expiry',
      };
    }

    return {
      type: 'mfg_date',
      label: 'Month & Year of Manufacture/Packing',
      detectedValue: null,
      confidence: 0.2,
      notes: 'Packaging or manufacturing date not detected',
    };
  }

  private static extractConsumerCare(text: string): ExtractedDeclaration {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const phoneRegex = /(?:1800[\s\-]?\d{3}[\s\-]?\d{3,4}|(?:\+?91[\s\-]?)?[6-9]\d{9}|\b0\d{2,4}[\s\-]?\d{6,8}\b)/;
    const careKeywordRegex = /(?:Consumer\s*Care|Customer\s*Care|Feedback|Queries|Grievance)/i;

    const hasCareKeyword = careKeywordRegex.test(text);
    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);

    if (emailMatch || phoneMatch || hasCareKeyword) {
      const parts: string[] = [];
      if (emailMatch) parts.push(`Email: ${emailMatch[0]}`);
      if (phoneMatch) parts.push(`Tel: ${phoneMatch[0]}`);

      if (parts.length > 0) {
        return {
          type: 'consumer_care',
          label: 'Consumer Care Details',
          detectedValue: parts.join(' | '),
          confidence: (emailMatch && phoneMatch) ? 0.97 : 0.86,
          rawSnippet: parts.join(', '),
          notes: 'Consumer care contact channel(s) detected',
        };
      }
    }

    return {
      type: 'consumer_care',
      label: 'Consumer Care Details',
      detectedValue: null,
      confidence: 0.15,
      notes: 'No consumer care email, toll-free number, or grievance desk detected',
    };
  }

  private static extractUnitSalePrice(text: string): ExtractedDeclaration {
    // "USP: Rs 0.25 / g" or "Unit Sale Price: ₹ 0.40 per ml"
    const uspRegex = /(?:Unit\s*Sale\s*Price|USP)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{1,4})?)\s*(?:per|\/)\s*(g|gm|kg|ml|l|meter|metre|u)/i;
    const match = text.match(uspRegex);

    if (match && match[1] && match[2]) {
      return {
        type: 'unit_sale_price',
        label: 'Unit Sale Price (USP)',
        detectedValue: `₹${match[1]} / ${match[2]}`,
        confidence: 0.93,
        rawSnippet: match[0],
        notes: 'Statutory unit sale price declared with unit quotient',
      };
    }

    return {
      type: 'unit_sale_price',
      label: 'Unit Sale Price (USP)',
      detectedValue: null,
      confidence: 0.4,
      notes: 'No dedicated unit sale price declaration detected',
    };
  }

  private static extractCountryOfOrigin(text: string): ExtractedDeclaration {
    const originRegex = /(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:\-]?\s*([A-Za-z\s]+)/i;
    const match = text.match(originRegex);

    if (match && match[1]) {
      const country = match[1].split('\n')[0].replace(/[\.,].*$/, '').trim();
      return {
        type: 'country_of_origin',
        label: 'Country of Origin',
        detectedValue: country,
        confidence: 0.92,
        rawSnippet: match[0],
      };
    }

    // Default for domestic products if domestic address is found
    if (/India|New\s*Delhi|Mumbai|Bengaluru|Chennai|Kolkata|Pune|Gujarat|Maharashtra/i.test(text)) {
      return {
        type: 'country_of_origin',
        label: 'Country of Origin',
        detectedValue: 'India (Inferred from domestic premise address)',
        confidence: 0.75,
      };
    }

    return {
      type: 'country_of_origin',
      label: 'Country of Origin',
      detectedValue: null,
      confidence: 0.3,
      notes: 'Country of origin not explicitly stated',
    };
  }
}
