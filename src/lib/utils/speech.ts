import { Lead, LeadRating, PurchaseTimeline, PriorityLevel } from '@/lib/types';

export interface ParsedNaturalLanguageLead {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company?: string;
  job_title?: string;
  email?: string;
  mobile?: string;
  rating?: LeadRating;
  priority?: PriorityLevel;
  product_interest?: string;
  purchase_timeline?: PurchaseTimeline;
  requirement?: string;
  followup_date?: string;
  raw_transcript: string;
}

// ----------------------------------------------------
// 1. Web Speech Recognition (Speech-to-Text)
// ----------------------------------------------------

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export interface SpeechRecognizerController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createSpeechRecognizer(options: {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (finalText: string, interimText: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}): SpeechRecognizerController | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = options.lang || 'en-US';
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interimResults ?? true;
  recognition.maxAlternatives = 1;

  let fullFinalTranscript = '';

  recognition.onstart = () => {
    options.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const part = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fullFinalTranscript += (fullFinalTranscript ? ' ' : '') + part.trim();
      } else {
        interimTranscript += part;
      }
    }
    options.onResult(fullFinalTranscript, interimTranscript);
  };

  recognition.onerror = (event: any) => {
    const errorMsg = event.error || 'Speech recognition error';
    if (errorMsg !== 'no-speech') {
      options.onError?.(errorMsg);
    }
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return {
    start: () => {
      try {
        fullFinalTranscript = '';
        recognition.start();
      } catch (e: any) {
        // Safe catch if already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (e) {}
    },
  };
}

// ----------------------------------------------------
// 2. Text-to-Speech (Text to Voice Note Playback)
// ----------------------------------------------------

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { stop: () => void } {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error('Speech synthesis not supported.'));
    return { stop: () => {} };
  }

  // Cancel any prior speech in flight
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[🎙️🔥☀️❄️✨]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    options?.onEnd?.();
    return { stop: () => {} };
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.lang = options?.lang || (/[؀-ۿ]/.test(cleanText) ? 'ar-AE' : 'en-US');

  // Attempt to select a high quality natural voice
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const matchingVoice = voices.find(
      (v) => v.lang.startsWith(utterance.lang.slice(0, 2)) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))
    ) || voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
  }

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (e) => options?.onError?.(e);

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
  };
}

// ----------------------------------------------------
// 3. Natural Language Lead Briefing Generator
// ----------------------------------------------------

export function generateLeadVoiceBriefing(lead: Partial<Lead>): string {
  const parts: string[] = [];

  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Exhibition Visitor';
  const company = lead.company ? `from ${lead.company}` : '';
  const title = lead.job_title ? `, ${lead.job_title},` : '';

  parts.push(`Lead briefing for ${name}${title} ${company}.`);

  if (lead.rating) {
    const ratingDesc =
      lead.rating === 'hot'
        ? 'High priority hot lead'
        : lead.rating === 'warm'
        ? 'Warm active lead'
        : 'Cold informational contact';
    parts.push(`Status: ${ratingDesc}.`);
  }

  if (lead.product_interest) {
    parts.push(`Primary interest is in ${lead.product_interest}.`);
  }

  if (lead.purchase_timeline) {
    parts.push(`Purchase timeline is ${lead.purchase_timeline}.`);
  }

  if (lead.requirement) {
    parts.push(`Key notes: ${lead.requirement}.`);
  }

  if (lead.followup_date) {
    parts.push(`Follow up scheduled for ${lead.followup_date}.`);
  }

  return parts.join(' ');
}

// ----------------------------------------------------
// 4. Natural Language Parser (Speech Transcript -> Lead)
// ----------------------------------------------------

export function parseNaturalLanguageText(transcript: string): ParsedNaturalLanguageLead {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const result: ParsedNaturalLanguageLead = {
    raw_transcript: text,
  };

  // 1. Rating extraction
  if (
    lower.includes('hot lead') ||
    lower.includes('very hot') ||
    lower.includes('urgent') ||
    lower.includes('ready to buy') ||
    lower.includes('high priority') ||
    lower.includes('contract ready') ||
    lower.includes('vip') ||
    lower.includes('live demo')
  ) {
    result.rating = 'hot';
    result.priority = 'high';
  } else if (
    lower.includes('cold') ||
    lower.includes('just looking') ||
    lower.includes('student') ||
    lower.includes('no budget') ||
    lower.includes('not interested')
  ) {
    result.rating = 'cold';
    result.priority = 'low';
  } else if (
    lower.includes('warm') ||
    lower.includes('interested') ||
    lower.includes('follow up')
  ) {
    result.rating = 'warm';
    result.priority = 'medium';
  } else {
    result.rating = 'warm';
    result.priority = 'medium';
  }

  // 2. Email extraction
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    result.email = emailMatch[1].toLowerCase();
  }

  // 3. Mobile / Phone extraction
  const phoneMatch = text.match(/(?:\+971|00971|0)?(?:50|51|52|54|55|56|58|2|3|4|6|7|9)\s?[0-9]{3}\s?[0-9]{4}/);
  if (phoneMatch) {
    result.mobile = phoneMatch[0].replace(/\s+/g, '');
  }

  // 4. Product / Solution matching
  if (
    lower.includes('ai') ||
    lower.includes('artificial intelligence') ||
    lower.includes('machine learning') ||
    lower.includes('copilot') ||
    lower.includes('gpt') ||
    lower.includes('llm')
  ) {
    result.product_interest = 'Enterprise AI Platform';
  } else if (
    lower.includes('cloud') ||
    lower.includes('aws') ||
    lower.includes('azure') ||
    lower.includes('infrastructure') ||
    lower.includes('hosting') ||
    lower.includes('server')
  ) {
    result.product_interest = 'Cloud Infrastructure & Security';
  } else if (
    lower.includes('analytics') ||
    lower.includes('crm') ||
    lower.includes('reporting') ||
    lower.includes('dashboard') ||
    lower.includes('bi')
  ) {
    result.product_interest = 'Smart Analytics & CRM Suite';
  } else if (
    lower.includes('cyber') ||
    lower.includes('security') ||
    lower.includes('compliance') ||
    lower.includes('firewall') ||
    lower.includes('penetration')
  ) {
    result.product_interest = 'Cybersecurity & Compliance';
  } else if (
    lower.includes('custom') ||
    lower.includes('outsourcing') ||
    lower.includes('development') ||
    lower.includes('software services')
  ) {
    result.product_interest = 'Custom Software Services';
  }

  // 5. Purchase timeline
  if (
    lower.includes('immediate') ||
    lower.includes('asap') ||
    lower.includes('this month') ||
    lower.includes('right away') ||
    lower.includes('in two weeks') ||
    lower.includes('in 2 weeks')
  ) {
    result.purchase_timeline = 'immediate';
  } else if (
    lower.includes('1 to 3 months') ||
    lower.includes('1-3 months') ||
    lower.includes('next quarter') ||
    lower.includes('next month')
  ) {
    result.purchase_timeline = '1-3 months';
  } else if (
    lower.includes('3 to 6 months') ||
    lower.includes('3-6 months')
  ) {
    result.purchase_timeline = '3-6 months';
  } else if (
    lower.includes('6 to 12 months') ||
    lower.includes('next year')
  ) {
    result.purchase_timeline = '6-12 months';
  }

  // 6. Name and Company Extraction
  // Patterns like: "Met [First] [Last] from [Company]" or "Spoke with [First] [Last] at [Company]"
  const metPattern = /(?:met|spoke with|speaking with|talking to|visitor is|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:from|at|with)\s+([A-Z0-9][A-Za-z0-9\s&]+?)(?:\.|\,|$|\s+(?:who|interested|he|she|phone|email|mobile))/i;
  const matchMet = text.match(metPattern);

  if (matchMet) {
    const rawName = matchMet[1].trim();
    const nameParts = rawName.split(/\s+/);
    result.first_name = nameParts[0];
    result.last_name = nameParts.slice(1).join(' ') || 'Visitor';
    result.full_name = rawName;
    result.company = matchMet[2].trim();
  } else {
    // Check separate "from [Company]"
    const companyMatch = text.match(/(?:from|at|works for|working at)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\.|\,|$|\s+(?:interested|phone|email|he|she))/i);
    if (companyMatch) {
      result.company = companyMatch[1].trim();
    }

    // Check separate name pattern e.g., "Name: Dr. Ahmed Al Mansoor"
    const nameMatch = text.match(/(?:name is|called|contact is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      const parts = nameMatch[1].trim().split(/\s+/);
      result.first_name = parts[0];
      result.last_name = parts.slice(1).join(' ') || 'Visitor';
      result.full_name = nameMatch[1].trim();
    }
  }

  // 7. Job Title Extraction
  const titlePatterns = [
    /(?:is|as)\s+(?:a|the)\s+([A-Za-z\s]+?(?:director|manager|officer|vp|vice president|head of [a-z\s]+|cto|ceo|cfo|cmo|founder|consultant|engineer|specialist))/i,
    /\b(cto|ceo|cfo|cmo|managing director|general manager|vice president|vp|head of [a-z\s]+|senior software engineer|solution architect)\b/i,
  ];

  for (const pat of titlePatterns) {
    const titleMatch = text.match(pat);
    if (titleMatch) {
      result.job_title = titleMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  // 8. Follow-up Date (e.g. "follow up next Tuesday", "in 3 days", "on Monday")
  if (lower.includes('tomorrow')) {
    result.followup_date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  } else if (lower.includes('in 2 days') || lower.includes('in two days')) {
    result.followup_date = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
  } else if (lower.includes('in 3 days') || lower.includes('in three days')) {
    result.followup_date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
  } else if (lower.includes('next week') || lower.includes('in a week')) {
    result.followup_date = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
  }

  // 9. Requirement / Notes
  result.requirement = text;

  return result;
}
