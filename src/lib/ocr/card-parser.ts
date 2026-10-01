/**
 * Enterprise Intelligent Business Card Text Parser
 * High-accuracy multi-field extraction for B2B events (GITEX, Arab Health, etc.)
 * Special focus on UAE, GCC, and International Mobile number detection
 */

export interface ParsedBusinessCard {
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  designation: string;
  email: string;
  phone: string; // Primary Mobile Number (e.g. +971 50 123 4567)
  landline?: string; // Office / Landline
  website: string;
  address: string;
  rawText: string;
}

const COMMON_DESIGNATIONS = [
  'chief executive officer', 'chief technology officer', 'chief operating officer',
  'chief financial officer', 'managing director', 'general manager', 'vice president',
  'deputy director', 'executive director', 'director of', 'director', 'ceo', 'cto', 'coo', 'cfo', 'vp',
  'president', 'head of', 'lead', 'senior manager', 'manager', 'assistant manager',
  'engineer', 'software engineer', 'senior engineer', 'solution architect', 'architect',
  'consultant', 'senior consultant', 'executive', 'account executive', 'business development manager',
  'business development', 'sales manager', 'sales director', 'sales executive', 'sales representative',
  'marketing manager', 'marketing director', 'operations manager', 'operations director',
  'founder', 'co-founder', 'partner', 'managing partner', 'officer', 'specialist',
  'developer', 'advisor', 'coordinator', 'administrator', 'supervisor', 'owner',
  'principal', 'analyst', 'associate', 'chairman', 'chairwoman'
];

const COMPANY_INDICATORS = [
  'llc', 'l.l.c', 'ltd', 'limited', 'inc', 'corp', 'corporation',
  'holdings', 'group', 'technologies', 'technology', 'tech', 'enterprises',
  'solutions', 'services', 'global', 'international', 'trading', 'industries',
  'systems', 'consultancy', 'consulting', 'ventures', 'media', 'agency',
  'bank', 'clinic', 'hospital', 'authority', 'ministry', 'properties', 'logistics'
];

const ADDRESS_INDICATORS = [
  'tower', 'towers', 'street', ' st', 'road', ' rd', 'building', 'bldg', 'floor',
  'office', 'po box', 'p.o. box', 'p.o.box', 'box no', 'area', 'zone', 'city',
  'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain',
  'uae', 'u.a.e.', 'dwtc', 'deira', 'al qusais', 'sheikh zayed', 'bay square',
  'downtown', 'jlt', 'difc', 'business bay', 'internet city', 'media city', 'riyadh', 'ksa'
];

interface ExtractedPhone {
  formatted: string;
  isMobile: boolean;
  score: number;
}

export function parseBusinessCardText(rawText: string): ParsedBusinessCard {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const usedLineIndices = new Set<number>();
  let email = '';
  let website = '';
  let designation = '';
  let company = '';
  let firstName = '';
  let lastName = '';
  let fullName = '';
  const addressParts: string[] = [];

  // -------------------------------------------------------------------------
  // 1. EXTRACT EMAIL (Scan everywhere, clean OCR typos)
  // -------------------------------------------------------------------------
  const emailRegex = /([a-zA-Z0-9._%+-]+(?:\s*@\s*|\s*\[at\]\s*)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/[|()[\]]/g, ' ').trim();
    const match = line.match(emailRegex);
    if (match) {
      email = match[1]
        .replace(/\s+/g, '')
        .replace(/\[at\]/i, '@')
        .toLowerCase()
        .replace(/\.con$/, '.com')
        .replace(/\.co$/, '.com');
      // If the line ONLY contains the email, mark it used.
      // If it also contains phone or other text, do NOT mark line completely used!
      const remainingLine = line.replace(match[0], '').replace(/[-|:,]/g, '').trim();
      if (remainingLine.length < 3) {
        usedLineIndices.add(i);
      }
      break;
    }
  }

  // -------------------------------------------------------------------------
  // 2. EXTRACT WEBSITE (Explicit URLs or standalone domains)
  // -------------------------------------------------------------------------
  const urlRegex = /(https?:\/\/[^\s|]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s|]*)?)/i;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(urlRegex);
    if (match) {
      website = match[1].toLowerCase().replace(/[;,.)\]]+$/, '');
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        website = `https://${website}`;
      }
      const remainingLine = lines[i].replace(match[0], '').replace(/[-|:,]/g, '').trim();
      if (remainingLine.length < 3) {
        usedLineIndices.add(i);
      }
      break;
    }

    // Match standalone domain like "alphatech.ae" or "aristostar.com"
    const domainMatch = lines[i].match(/\b([a-zA-Z0-9-]+\.(?:com|ae|org|net|io|llc|me|ai|co))\b/i);
    if (domainMatch && !lines[i].includes('@')) {
      website = `https://www.${domainMatch[1].toLowerCase()}`;
      const remainingLine = lines[i].replace(domainMatch[0], '').replace(/[-|:,]/g, '').trim();
      if (remainingLine.length < 3) {
        usedLineIndices.add(i);
      }
      break;
    }
  }

  // Deduce website from email domain if not found
  if (!website && email) {
    const domain = email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'mail.com'].includes(domain)) {
      website = `https://www.${domain}`;
    }
  }

  // -------------------------------------------------------------------------
  // 3. ROBUST PHONE & MOBILE EXTRACTION (Multi-number, Prefix, OCR cleaning)
  // -------------------------------------------------------------------------
  const extractedPhones: ExtractedPhone[] = [];
  const phoneSegments = rawText.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < phoneSegments.length; lineIndex++) {
    let line = phoneSegments[lineIndex].trim();
    if (!line) continue;

    // OCR character sanitization inside digit-heavy lines:
    // Common OCR mistakes: 'O' or 'o' instead of 0, 'l' or 'I' instead of 1, 'S' instead of 5
    // e.g. "+971 SO" or "+971 5O"
    line = line.replace(/(\+971|\b00971|\b05)\s*([SOso])([0-9])/g, '$1 5$3');
    line = line.replace(/([0-9])\s*([SOso])\s*([0-9])/g, '$1 0 $3');
    line = line.replace(/(\+966|\b00966|\b05)\s*([SOso])([0-9])/g, '$1 5$3');

    // Split line by delimiters like '|', ';', '•', '/', ',', tabs, multi-spaces
    // or boundary before another labeled phone prefix
    const parts = line
      .split(/(?:[|;•/,\t]|\s{2,}|\s+(?=(?:m|mob|mobile|cell|cellular|tel|t|ph|phone|fax|f|direct|d|whatsapp|wa|gsm)\s*[:.\-]))/i)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      const cleanPart = part.trim();
      if (!cleanPart) continue;

      // Extract all potential phone numbers with labels
      const mobileLabelRegex = /(?:^|\s)(?:m|mob|mobile|cell|cellular|whatsapp|wa|direct|dir|handy|gsm)\s*[:.\-]?\s*([+]?[0-9\s.\-()]{7,25})/i;
      const telLabelRegex = /(?:^|\s)(?:t|tel|telephone|office|work|hq|ph|phone|landline|p)\s*[:.\-]?\s*([+]?[0-9\s.\-()]{7,25})/i;
      const faxLabelRegex = /(?:^|\s)(?:f|fax|facsimile)\s*[:.\-]?\s*([+]?[0-9\s.\-()]{7,25})/i;

      // Case A: Labeled Mobile (Highest score)
      const mobMatch = cleanPart.match(mobileLabelRegex);
      if (mobMatch) {
        const digits = mobMatch[1].replace(/\D/g, '');
        if (digits.length >= 7) {
          extractedPhones.push({
            formatted: formatPhoneNumber(mobMatch[1]),
            isMobile: true,
            score: 110,
          });
          usedLineIndices.add(lineIndex);
          continue;
        }
      }

      // Case B: Labeled Telephone / Office landline
      const telMatch = cleanPart.match(telLabelRegex);
      if (telMatch) {
        const digits = telMatch[1].replace(/\D/g, '');
        if (digits.length >= 7) {
          const mobileCheck = identifyMobileSignature(telMatch[1]);
          extractedPhones.push({
            formatted: formatPhoneNumber(telMatch[1]),
            isMobile: mobileCheck.isMobile,
            score: mobileCheck.isMobile ? 80 : 45,
          });
          usedLineIndices.add(lineIndex);
          continue;
        }
      }

      // Case C: Labeled Fax (Ignore / mark used)
      const faxMatch = cleanPart.match(faxLabelRegex);
      if (faxMatch) {
        usedLineIndices.add(lineIndex);
        continue;
      }

      // Case D: Unlabeled Number - Run Global Mobile & Phone Signature Detection
      const phoneCandidateMatch = cleanPart.match(/(?:(?:\+|00)[0-9]{1,4}[-.\s]*)?(?:\(?[0-9]{1,4}\)?[-.\s]*)?[0-9]{2,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{2,4}/);
      if (phoneCandidateMatch) {
        const candidateStr = phoneCandidateMatch[0].trim();
        const digits = candidateStr.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 16) {
          const sig = identifyMobileSignature(candidateStr);
          extractedPhones.push({
            formatted: formatPhoneNumber(candidateStr),
            isMobile: sig.isMobile,
            score: sig.score,
          });
          usedLineIndices.add(lineIndex);
        }
      }
    }
  }

  // Sort extracted phones: highest score and mobile first
  extractedPhones.sort((a, b) => b.score - a.score);

  let phone = '';
  let landline = '';

  if (extractedPhones.length > 0) {
    // Primary mobile
    const primary = extractedPhones[0];
    phone = primary.formatted;

    // Check if there is a separate landline
    const secondary = extractedPhones.find((p) => p.formatted !== primary.formatted);
    if (secondary) {
      landline = secondary.formatted;
    }
  }

  // -------------------------------------------------------------------------
  // 4. EXTRACT DESIGNATION / JOB TITLE
  // -------------------------------------------------------------------------
  let designationLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (usedLineIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();

    // Check if line contains a known job title
    const match = COMMON_DESIGNATIONS.find((d) => lower.includes(d));
    if (match && lines[i].length < 65 && !/\d{4,}/.test(lines[i])) {
      designation = lines[i]
        .replace(/^[|•\->]+\s*/, '')
        .replace(/[|•]+$/, '')
        .trim();
      designationLineIndex = i;
      usedLineIndices.add(i);
      break;
    }
  }

  // -------------------------------------------------------------------------
  // 5. EXTRACT ADDRESS
  // -------------------------------------------------------------------------
  for (let i = 0; i < lines.length; i++) {
    if (usedLineIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();

    const isAddress = ADDRESS_INDICATORS.some((addr) => lower.includes(addr));
    if (isAddress || (/\b\d{3,5}\b/.test(lower) && lower.includes(','))) {
      addressParts.push(lines[i]);
      usedLineIndices.add(i);
    }
  }

  // -------------------------------------------------------------------------
  // 6. EXTRACT PERSON NAME (Typically adjacent to designation)
  // -------------------------------------------------------------------------
  let nameCandidate = '';

  if (designationLineIndex !== -1) {
    // Check line immediately preceding designation
    for (let prev = designationLineIndex - 1; prev >= 0; prev--) {
      if (!usedLineIndices.has(prev)) {
        if (isValidNameLine(lines[prev])) {
          nameCandidate = lines[prev];
          usedLineIndices.add(prev);
          break;
        }
      }
    }

    // If not found, check line immediately following designation
    if (!nameCandidate) {
      for (let next = designationLineIndex + 1; next < lines.length; next++) {
        if (!usedLineIndices.has(next)) {
          if (isValidNameLine(lines[next])) {
            nameCandidate = lines[next];
            usedLineIndices.add(next);
            break;
          }
        }
      }
    }
  }

  // Fallback for Name Candidate from remaining unused lines
  if (!nameCandidate) {
    for (let i = 0; i < lines.length; i++) {
      if (usedLineIndices.has(i)) continue;
      if (isValidNameLine(lines[i])) {
        nameCandidate = lines[i];
        usedLineIndices.add(i);
        break;
      }
    }
  }

  if (nameCandidate) {
    fullName = nameCandidate.replace(/^[|•\->]+\s*/, '').trim();
    // Clean honorifics for firstName & lastName fields
    const cleanName = fullName.replace(/^(?:mr\.|mr|mrs\.|mrs|ms\.|ms|dr\.|dr|eng\.|eng|sheikh|h\.e\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = cleanName;
      lastName = '';
    }
  }

  // -------------------------------------------------------------------------
  // 7. EXTRACT COMPANY NAME
  // -------------------------------------------------------------------------
  // Priority A: Line containing company indicator (LLC, Ltd, Group, Technologies, etc.)
  for (let i = 0; i < lines.length; i++) {
    if (usedLineIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();

    // Guard: Must NOT contain phone indicators or digits > 4
    if (/\b(?:tel|mob|fax|phone|cell)\b/i.test(lower) || /\d{5,}/.test(lower)) {
      continue;
    }

    const hasIndicator = COMPANY_INDICATORS.some((ind) => lower.includes(ind));
    if (hasIndicator && lines[i].length < 65) {
      company = lines[i].replace(/^[|•\->]+\s*/, '').trim();
      usedLineIndices.add(i);
      break;
    }
  }

  // Priority B: Top-most unused line (usually Header Logo / Company Name)
  if (!company) {
    for (let i = 0; i < lines.length; i++) {
      if (usedLineIndices.has(i)) continue;
      const candidate = lines[i].trim();

      // Guard: Not a phone number, not an email, not address
      if (
        candidate.length >= 3 &&
        candidate.length < 50 &&
        !/\d{4,}/.test(candidate) &&
        !/\b(?:tel|mob|fax|email|www)\b/i.test(candidate)
      ) {
        company = candidate;
        usedLineIndices.add(i);
        break;
      }
    }
  }

  // Priority C: Deduce company from website domain or email domain
  if (!company && (website || email)) {
    const domain = website
      ? website.replace(/^https?:\/\/(?:www\.)?/, '').split(/[\/.]/)[0]
      : email.split('@')[1]?.split('.')[0];

    if (domain && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'mail'].includes(domain.toLowerCase())) {
      company = domain
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    fullName: fullName || `${firstName} ${lastName}`.trim(),
    company: company || '',
    designation: designation || '',
    email: email || '',
    phone: phone || '',
    landline: landline || '',
    website: website || '',
    address: addressParts.join(', '),
    rawText,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidNameLine(line: string): boolean {
  const clean = line.replace(/^[|•\->]+\s*/, '').trim();
  const words = clean.split(/\s+/);

  // Must have 2-4 words, no numbers, no '@', not overly long
  if (words.length < 2 || words.length > 5) return false;
  if (/\d/.test(clean)) return false;
  if (/@/.test(clean) || /www\./i.test(clean)) return false;
  if (clean.length > 45) return false;

  // Must not contain company indicators
  const lower = clean.toLowerCase();
  if (COMPANY_INDICATORS.some((ind) => lower.includes(ind))) return false;

  // Must not contain designation words
  if (COMMON_DESIGNATIONS.some((d) => lower.includes(d))) return false;

  return true;
}
export function identifyMobileSignature(raw: string): { isMobile: boolean; country: string; score: number } {
  const digits = raw.replace(/\D/g, '');
  // UAE Mobile (+971 50/51/52/54/55/56/58 or 050/051/052/054/055/056/058)
  if (/^(?:971|00971|0)?(5[0124568]\d{7})$/.test(digits)) return { isMobile: true, country: 'UAE', score: 95 };
  // Saudi Arabia Mobile (+966 5x xxx xxxx or 05x xxx xxxx)
  if (/^(?:966|00966|0)?(5\d{8})$/.test(digits)) return { isMobile: true, country: 'KSA', score: 90 };
  // Qatar Mobile (+974 3/5/6/7 xxx xxxx)
  if (/^(?:974|00974)?([3567]\d{7})$/.test(digits)) return { isMobile: true, country: 'Qatar', score: 90 };
  // Kuwait Mobile (+965 5/6/9 xxx xxxx)
  if (/^(?:965|00965)?([569]\d{7})$/.test(digits)) return { isMobile: true, country: 'Kuwait', score: 90 };
  // Bahrain Mobile (+973 3/6 xxx xxxx)
  if (/^(?:973|00973)?([36]\d{7})$/.test(digits)) return { isMobile: true, country: 'Bahrain', score: 90 };
  // Oman Mobile (+968 7/9 xxx xxxx)
  if (/^(?:968|00968)?([79]\d{7})$/.test(digits)) return { isMobile: true, country: 'Oman', score: 90 };
  // India Mobile (+91 6-9xxxx xxxxx)
  if (/^(?:91|0091|0)?([6-9]\d{9})$/.test(digits)) return { isMobile: true, country: 'India', score: 85 };
  // UK Mobile (+44 7xxx xxxxxx)
  if (/^(?:44|0044|0)?(7\d{9})$/.test(digits)) return { isMobile: true, country: 'UK', score: 85 };
  // North America (+1 NXX NXX XXXX)
  if (/^(?:1)?([2-9]\d{2}[2-9]\d{6})$/.test(digits)) return { isMobile: true, country: 'US/CA', score: 80 };
  // UAE Landline (+971 2/3/4/6/7/9 xxx xxxx)
  if (/^(?:971|00971|0)?([234679]\d{7})$/.test(digits)) return { isMobile: false, country: 'UAE-Landline', score: 45 };
  return { isMobile: false, country: 'Other', score: 35 };
}

export function formatPhoneNumber(raw: string): string {
  // Strip non-dialable characters while preserving '+'
  let cleaned = raw
    .replace(/[^\d+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading zeros if preceded by +
  cleaned = cleaned.replace(/^\+\s*0+/, '+');

  const digits = cleaned.replace(/\D/g, '');

  // Format UAE mobile: e.g. "+971 50 123 4567"
  const uaeMobMatch = digits.match(/^(?:971|00971|0)?(5[0124568])(\d{3})(\d{4})$/);
  if (uaeMobMatch) {
    return `+971 ${uaeMobMatch[1]} ${uaeMobMatch[2]} ${uaeMobMatch[3]}`;
  }

  // Format UAE landline: e.g. "+971 4 399 8888"
  const uaeLandMatch = digits.match(/^(?:971|00971|0)?([234679])(\d{3})(\d{4})$/);
  if (uaeLandMatch) {
    return `+971 ${uaeLandMatch[1]} ${uaeLandMatch[2]} ${uaeLandMatch[3]}`;
  }

  // Format KSA mobile: e.g. "+966 50 555 1234"
  const ksaMatch = digits.match(/^(?:966|00966|0)?(5\d)(\d{3})(\d{4})$/);
  if (ksaMatch) {
    return `+966 ${ksaMatch[1]} ${ksaMatch[2]} ${ksaMatch[3]}`;
  }

  // Format Qatar: e.g. "+974 5512 3456"
  const qatarMatch = digits.match(/^(?:974|00974)?([3567]\d{3})(\d{4})$/);
  if (qatarMatch) {
    return `+974 ${qatarMatch[1]} ${qatarMatch[2]}`;
  }

  // Format Kuwait: e.g. "+965 9912 3456"
  const kuwaitMatch = digits.match(/^(?:965|00965)?([569]\d{3})(\d{4})$/);
  if (kuwaitMatch) {
    return `+965 ${kuwaitMatch[1]} ${kuwaitMatch[2]}`;
  }

  // Format Bahrain: e.g. "+973 3912 3456"
  const bahrainMatch = digits.match(/^(?:973|00973)?([36]\d{3})(\d{4})$/);
  if (bahrainMatch) {
    return `+973 ${bahrainMatch[1]} ${bahrainMatch[2]}`;
  }

  // Format Oman: e.g. "+968 9912 3456"
  const omanMatch = digits.match(/^(?:968|00968)?([79]\d{3})(\d{4})$/);
  if (omanMatch) {
    return `+968 ${omanMatch[1]} ${omanMatch[2]}`;
  }

  // Format India: e.g. "+91 98765 43210"
  const indiaMatch = digits.match(/^(?:91|0091|0)?([6-9]\d{4})(\d{5})$/);
  if (indiaMatch) {
    return `+91 ${indiaMatch[1]} ${indiaMatch[2]}`;
  }

  // Format UK: e.g. "+44 7911 123456"
  const ukMatch = digits.match(/^(?:44|0044|0)?(7\d{3})(\d{6})$/);
  if (ukMatch) {
    return `+44 ${ukMatch[1]} ${ukMatch[2]}`;
  }

  // Format US/CA: e.g. "+1 (415) 555-0199"
  const usMatch = digits.match(/^(?:1)?([2-9]\d{2})([2-9]\d{2})(\d{4})$/);
  if (usMatch) {
    return `+1 (${usMatch[1]}) ${usMatch[2]}-${usMatch[3]}`;
  }

  return cleaned;
}
