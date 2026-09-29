/**
 * Intelligent Business Card Text Parser
 * Extracts structured lead data from OCR output
 */

export interface ParsedBusinessCard {
  firstName: string;
  lastName: string;
  company: string;
  designation: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  rawText: string;
}

const COMMON_DESIGNATIONS = [
  'manager', 'director', 'ceo', 'cto', 'coo', 'cfo', 'vp', 'vice president',
  'president', 'head of', 'lead', 'engineer', 'consultant', 'executive',
  'founder', 'co-founder', 'partner', 'officer', 'specialist', 'developer',
  'architect', 'representative', 'advisor', 'coordinator', 'administrator',
  'supervisor', 'owner', 'principal', 'analyst', 'associate', 'chairman',
  'business development', 'sales', 'marketing', 'operations', 'managing director'
];

const COMPANY_INDICATORS = [
  'llc', 'l.l.c', 'ltd', 'limited', 'inc', 'corp', 'corporation',
  'holdings', 'group', 'technologies', 'tech', 'enterprises', 'solutions',
  'services', 'global', 'international', 'trading', 'industries', 'systems',
  'consultancy', 'consulting', 'ventures', 'media', 'agency'
];

const ADDRESS_INDICATORS = [
  'tower', 'street', ' st', 'road', ' rd', 'building', 'bldg', 'floor',
  'office', 'po box', 'p.o. box', 'box no', 'area', 'zone', 'city', 'dubai',
  'abu dhabi', 'sharjah', 'uae', 'u.a.e.', 'dwtc', 'deira', 'al qusais',
  'damascus', 'sheikh zayed', 'bay square', 'downtown', 'jlt', 'difc'
];

export function parseBusinessCardText(rawText: string): ParsedBusinessCard {
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 1);

  const usedIndices = new Set<number>();
  let email = '';
  let website = '';
  let phone = '';
  let designation = '';
  let company = '';
  let firstName = '';
  let lastName = '';
  const addressParts: string[] = [];

  // 1. Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  for (let i = 0; i < lines.length; i++) {
    // Clean common OCR anomalies for emails
    const line = lines[i].replace(/[|()[\]]/g, '').trim();
    const match = line.match(emailRegex);
    if (match) {
      email = match[1].toLowerCase().replace(/\.con$/, '.com');
      usedIndices.add(i);
      break;
    }
  }

  // 2. Extract Website
  const urlRegex = /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const match = lines[i].match(urlRegex);
    if (match) {
      website = match[1].toLowerCase();
      if (!website.startsWith('http://') && !website.startsWith('https://')) {
        website = `https://${website}`;
      }
      usedIndices.add(i);
      break;
    }
    // Also match standalone domain like "aristostar.com"
    const domainMatch = lines[i].match(/\b([a-zA-Z0-9-]+\.(?:com|ae|org|net|io|llc))\b/i);
    if (domainMatch && !lines[i].includes('@')) {
      website = `https://www.${domainMatch[1].toLowerCase()}`;
      usedIndices.add(i);
      break;
    }
  }

  // Deduce website from email domain if not found
  if (!website && email) {
    const domain = email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'].includes(domain)) {
      website = `https://www.${domain}`;
    }
  }

  // 3. Extract Phone / Mobile
  // Match +971... or international numbers or numbers with 7+ digits
  const phonePrefixRegex = /^(?:tel|mob|mobile|cell|phone|whatsapp|p|m|t|ph|f)\s*[:.\-]?\s*/i;
  const digitsRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;

  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const line = lines[i];
    
    // Check if line looks like phone
    const hasPhonePrefix = phonePrefixRegex.test(line);
    const cleanedLine = line.replace(phonePrefixRegex, '').trim();
    
    if (hasPhonePrefix || cleanedLine.match(/^\+?[0-9\s.\-()]{8,20}$/)) {
      const match = cleanedLine.match(digitsRegex);
      if (match && match[0].replace(/\D/g, '').length >= 7) {
        phone = cleanedLine;
        usedIndices.add(i);
        break;
      }
    }
  }

  // 4. Extract Designation / Job Title
  let designationLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();
    
    const isDesignation = COMMON_DESIGNATIONS.some(d => lower.includes(d));
    if (isDesignation && lines[i].length < 60) {
      designation = lines[i];
      designationLineIndex = i;
      usedIndices.add(i);
      break;
    }
  }

  // 5. Extract Address parts
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();
    const isAddress = ADDRESS_INDICATORS.some(addr => lower.includes(addr));
    if (isAddress || /\b\d{3,5}\b/.test(lower) && lower.includes(',')) {
      addressParts.push(lines[i]);
      usedIndices.add(i);
    }
  }

  // 6. Extract Name
  // Typically, name is positioned right adjacent to designation (line before or after)
  let nameCandidate = '';
  
  if (designationLineIndex !== -1) {
    // Check immediately preceding unused line
    for (let prev = designationLineIndex - 1; prev >= 0; prev--) {
      if (!usedIndices.has(prev)) {
        nameCandidate = lines[prev];
        usedIndices.add(prev);
        break;
      }
    }
    // Or immediately following line if preceding was not found
    if (!nameCandidate) {
      for (let next = designationLineIndex + 1; next < lines.length; next++) {
        if (!usedIndices.has(next)) {
          nameCandidate = lines[next];
          usedIndices.add(next);
          break;
        }
      }
    }
  }

  // Fallback for name candidate from remaining lines
  if (!nameCandidate) {
    for (let i = 0; i < lines.length; i++) {
      if (usedIndices.has(i)) continue;
      const words = lines[i].split(/\s+/);
      // Names are typically 2-4 words, capitalized, no numbers/symbols
      if (words.length >= 2 && words.length <= 4 && !/\d/.test(lines[i])) {
        nameCandidate = lines[i];
        usedIndices.add(i);
        break;
      }
    }
  }

  if (nameCandidate) {
    // Clean name of titles like Mr., Dr., Eng.
    const cleanName = nameCandidate.replace(/^(mr\.|mrs\.|ms\.|dr\.|eng\.|sheikh|h\.e\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length > 1) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = cleanName;
      lastName = '';
    }
  }

  // 7. Extract Company Name
  // Look for company indicators or first unused header line
  for (let i = 0; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const lower = lines[i].toLowerCase();
    const hasIndicator = COMPANY_INDICATORS.some(ind => lower.includes(ind));
    if (hasIndicator && lines[i].length < 60) {
      company = lines[i];
      usedIndices.add(i);
      break;
    }
  }

  // If no company found yet, pick top unused line (often company header / logo text)
  if (!company) {
    for (let i = 0; i < lines.length; i++) {
      if (!usedIndices.has(i) && lines[i].length > 2 && lines[i].length < 45 && !/\d{5,}/.test(lines[i])) {
        company = lines[i];
        usedIndices.add(i);
        break;
      }
    }
  }

  // If still no company, deduce from website domain or email domain
  if (!company && (website || email)) {
    const domain = website 
      ? website.replace(/^https?:\/\/(?:www\.)?/, '').split(/[\/.]/)[0]
      : email.split('@')[1]?.split('.')[0];
    
    if (domain && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud'].includes(domain.toLowerCase())) {
      // Capitalize domain words (e.g. "aristostar" -> "Aristo Star")
      company = domain
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    company: company || '',
    designation: designation || '',
    email: email || '',
    phone: phone || '',
    website: website || '',
    address: addressParts.join(', '),
    rawText,
  };
}
