export interface ParsedBadgeData {
  badgeId: string;
  rawText: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  website?: string;
  visitorType?: string;
}

/**
 * Universal Event Badge QR Code Parser
 * Supports:
 * - lead2b native badges ("lead2b:badge:GITEX2026-ATT-00101")
 * - JSON encoded badges ({"id": "...", "name": "...", "company": "...", "email": "..."})
 * - vCard formats (BEGIN:VCARD ... END:VCARD)
 * - MeCard formats (MECARD:N:...;ORG:...;EMAIL:...;;)
 * - URLs with badge IDs (https://gitex.com/badge?id=GITEX2026-ATT-00101)
 * - Raw string badge IDs
 */
export function parseBadgeQr(rawText: string): ParsedBadgeData {
  const text = rawText.trim();

  // 1. lead2b native prefix
  if (text.startsWith('lead2b:badge:')) {
    const badgeId = text.replace('lead2b:badge:', '').trim();
    return { badgeId, rawText: text };
  }

  // 2. JSON encoded badge
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const data = JSON.parse(text);
      const badgeId = data.badge_id || data.badgeId || data.id || data.token || data.code || `BADGE-${Date.now()}`;
      return {
        badgeId: String(badgeId),
        rawText: text,
        firstName: data.first_name || data.firstName || (data.name ? data.name.split(' ')[0] : undefined),
        lastName: data.last_name || data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : undefined),
        fullName: data.name || data.full_name || data.fullName,
        company: data.company || data.organization || data.org,
        jobTitle: data.job_title || data.jobTitle || data.title || data.designation,
        email: data.email || data.mail,
        phone: data.phone || data.mobile || data.tel,
        website: data.website || data.url,
        visitorType: data.visitor_type || data.visitorType || data.type || data.category,
      };
    } catch (e) {
      // Not valid JSON, continue
    }
  }

  // 3. vCard format (Standard business card QR)
  if (text.toUpperCase().includes('BEGIN:VCARD')) {
    const lines = text.split(/\r?\n/);
    const card: Record<string, string> = {};

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].toUpperCase().split(';')[0];
        const val = parts.slice(1).join(':').trim();
        card[key] = val;
      }
    }

    let firstName = '';
    let lastName = '';
    if (card['N']) {
      const nParts = card['N'].split(';');
      lastName = nParts[0] || '';
      firstName = nParts[1] || '';
    } else if (card['FN']) {
      const fnParts = card['FN'].split(' ');
      firstName = fnParts[0] || '';
      lastName = fnParts.slice(1).join(' ') || '';
    }

    const badgeId = card['UID'] || card['X-BADGE-ID'] || card['EMAIL'] || `VCARD-${Date.now()}`;

    return {
      badgeId,
      rawText: text,
      firstName,
      lastName,
      fullName: card['FN'] || `${firstName} ${lastName}`.trim(),
      company: card['ORG'],
      jobTitle: card['TITLE'],
      email: card['EMAIL'],
      phone: card['TEL'],
      website: card['URL'],
    };
  }

  // 4. MeCard format (common in Asian & European badges)
  if (text.toUpperCase().startsWith('MECARD:')) {
    const content = text.slice(7);
    const fields = content.split(';');
    const map: Record<string, string> = {};

    for (const f of fields) {
      const idx = f.indexOf(':');
      if (idx !== -1) {
        const k = f.slice(0, idx).toUpperCase();
        const v = f.slice(idx + 1);
        map[k] = v;
      }
    }

    let firstName = '';
    let lastName = '';
    if (map['N']) {
      const parts = map['N'].split(',');
      lastName = parts[0] || '';
      firstName = parts[1] || '';
    }

    return {
      badgeId: map['EMAIL'] || map['TEL'] || `MECARD-${Date.now()}`,
      rawText: text,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      company: map['ORG'],
      jobTitle: map['TIL'],
      email: map['EMAIL'],
      phone: map['TEL'],
      website: map['URL'],
    };
  }

  // 5. URL format (e.g., https://event.com/badge?id=GITEX-123 or https://badge.live/GITEX-123)
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text);
      const idParam =
        url.searchParams.get('badge_id') ||
        url.searchParams.get('badgeId') ||
        url.searchParams.get('id') ||
        url.searchParams.get('badge') ||
        url.searchParams.get('token') ||
        url.searchParams.get('attendee');

      if (idParam) {
        return { badgeId: idParam, rawText: text };
      }

      // If no query param, check last segment of path
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last && last.length > 2) {
          return { badgeId: last, rawText: text };
        }
      }
    } catch (e) {
      // URL parsing failed
    }
  }

  // 6. Default: Treat raw text as badge ID
  return {
    badgeId: text,
    rawText: text,
  };
}
