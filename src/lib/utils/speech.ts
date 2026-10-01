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
  isListening: () => boolean;
}

export function createSpeechRecognizer(options: {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (finalText: string, interimText: string) => void;
  onError?: (friendlyError: string, rawError?: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}): SpeechRecognizerController | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('Speech recognition is not supported in this browser. Please use Chrome, Safari or Edge.');
    return null;
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  let recognition: any = null;
  let fullFinalTranscript = '';
  let shouldBeListening = false;
  let restartTimeout: any = null;

  try {
    recognition = new SpeechRecognitionClass();
  } catch (e: any) {
    options.onError?.('Failed to initialize speech recognition engine.', e?.message);
    return null;
  }

  recognition.lang = options.lang || 'en-US';
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interimResults ?? true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    shouldBeListening = true;
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
    options.onResult(fullFinalTranscript.trim(), interimTranscript.trim());
  };

  recognition.onerror = (event: any) => {
    const rawError = event.error || 'unknown';
    console.warn('[Speech] Recognition error:', rawError);

    let friendly = 'Microphone or speech recognition error.';
    if (rawError === 'not-allowed' || rawError === 'service-not-allowed') {
      friendly = 'Microphone permission denied. Please allow microphone access in your browser.';
      shouldBeListening = false;
    } else if (rawError === 'network') {
      friendly = 'Speech recognition requires active internet connection. Please verify network or type notes manually.';
      shouldBeListening = false;
    } else if (rawError === 'audio-capture') {
      friendly = 'Microphone is currently unavailable or used by another application.';
      shouldBeListening = false;
    } else if (rawError === 'no-speech') {
      // Don't show critical error for brief silence; stay listening if continuous
      return;
    }

    options.onError?.(friendly, rawError);
  };

  recognition.onend = () => {
    if (shouldBeListening) {
      // Auto-restart if browser prematurely ended due to short pause
      clearTimeout(restartTimeout);
      restartTimeout = setTimeout(() => {
        if (shouldBeListening && recognition) {
          try {
            recognition.start();
          } catch (e) {
            shouldBeListening = false;
            options.onEnd?.();
          }
        }
      }, 250);
    } else {
      options.onEnd?.();
    }
  };

  return {
    start: () => {
      shouldBeListening = true;
      fullFinalTranscript = '';
      try {
        recognition.start();
      } catch (e: any) {
        // In case recognition was already active
        try {
          recognition.stop();
          setTimeout(() => {
            if (shouldBeListening) recognition.start();
          }, 150);
        } catch (err) {}
      }
    },
    stop: () => {
      shouldBeListening = false;
      clearTimeout(restartTimeout);
      try {
        recognition.stop();
      } catch (e) {}
      options.onEnd?.();
    },
    abort: () => {
      shouldBeListening = false;
      clearTimeout(restartTimeout);
      try {
        recognition.abort();
      } catch (e) {}
      options.onEnd?.();
    },
    isListening: () => shouldBeListening,
  };
}

// ----------------------------------------------------
// 2. Text-to-Speech (Text Information to Voice Note)
// ----------------------------------------------------

// ----------------------------------------------------
// 2. Text-to-Speech (Stubbed - TTS Disabled Per System Specifications)
// ----------------------------------------------------

export function isSpeechSynthesisSupported(): boolean {
  return false;
}

export function stopSpeaking(): void {
  // TTS disabled
}

export function speakText(
  _text: string,
  _options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { stop: () => void } {
  return { stop: () => {} };
}

export function generateLeadVoiceBriefing(lead: Partial<Lead>): string {
  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Exhibition Visitor';
  const company = lead.company ? `from ${lead.company}` : '';
  return `Lead briefing for ${name} ${company}.`.trim();
}

// ----------------------------------------------------
// 3. Spoken Text Normalization Helpers
// ----------------------------------------------------

const SPOKEN_DIGIT_MAP: Record<string, string> = {
  zero: '0',
  oh: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

export function normalizeSpokenText(input: string): string {
  if (!input) return '';

  let text = input.trim();

  // Normalize common spoken email tokens
  text = text
    .replace(/\s+(?:at\s+the\s+rate|at\s+rate|at)\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+underscore\s+/gi, '_')
    .replace(/\s+hyphen\s+|\s+dash\s+/gi, '-');

  // Fix common TLD spoken artifacts
  text = text
    .replace(/@\s+/g, '@')
    .replace(/\s+\./g, '.')
    .replace(/\.\s+/g, '.')
    .replace(/\.(?:com|net|org|io|ae|gov|edu|me|co)\b/gi, (match) => match.toLowerCase());

  // Normalize spoken phone numbers: e.g. "plus nine seven one" -> "+971"
  text = text.replace(/\bplus\s+nine\s+seven\s+one\b/gi, '+971');
  text = text.replace(/\bplus\b/gi, '+');
  text = text.replace(/\bdouble\s+zero\b/gi, '00');

  // Convert sequences of spoken digit words to numbers
  const words = text.split(/\s+/);
  const normalizedWords: string[] = [];
  let digitBuffer: string[] = [];

  const flushDigits = () => {
    if (digitBuffer.length > 0) {
      if (digitBuffer.length >= 3) {
        normalizedWords.push(digitBuffer.join(''));
      } else {
        // If only 1-2 words like "one step", keep original
        normalizedWords.push(...digitBuffer);
      }
      digitBuffer = [];
    }
  };

  for (const w of words) {
    const cleanW = w.toLowerCase().replace(/[^a-z]/g, '');
    if (SPOKEN_DIGIT_MAP[cleanW] !== undefined) {
      digitBuffer.push(SPOKEN_DIGIT_MAP[cleanW]);
    } else {
      flushDigits();
      normalizedWords.push(w);
    }
  }
  flushDigits();

  return normalizedWords.join(' ');
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ----------------------------------------------------
// 4. Natural Language Parser (Speech Transcript -> Structured Lead)
// ----------------------------------------------------

export function parseNaturalLanguageText(transcript: string): ParsedNaturalLanguageLead {
  const normalized = normalizeSpokenText(transcript);
  const text = normalized.trim();
  const lower = text.toLowerCase();
  const result: ParsedNaturalLanguageLead = {
    raw_transcript: transcript.trim(),
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
    lower.includes('live demo') ||
    lower.includes('top priority') ||
    lower.includes('decision maker')
  ) {
    result.rating = 'hot';
    result.priority = 'high';
  } else if (
    lower.includes('cold') ||
    lower.includes('just looking') ||
    lower.includes('student') ||
    lower.includes('no budget') ||
    lower.includes('not interested') ||
    lower.includes('low priority')
  ) {
    result.rating = 'cold';
    result.priority = 'low';
  } else if (
    lower.includes('warm') ||
    lower.includes('interested') ||
    lower.includes('follow up') ||
    lower.includes('evaluate') ||
    lower.includes('proposal')
  ) {
    result.rating = 'warm';
    result.priority = 'medium';
  } else {
    result.rating = 'warm';
    result.priority = 'medium';
  }

  // 2. Email extraction (handles both standard and spoken-normalized formats)
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.email = emailMatch[1].toLowerCase();
  }

  // 3. Mobile / Phone extraction (UAE +971, 05X, GCC, and international formats)
  const phoneMatch = text.match(/(?:\+?971|00971|0)?(?:50|51|52|54|55|56|58|2|3|4|6|7|9)\s?[0-9]{3}\s?[0-9]{4}/) ||
    text.match(/\+?[0-9]{1,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/);
  if (phoneMatch) {
    result.mobile = phoneMatch[0].replace(/[\s.-]/g, '');
  }

  // 4. Product / Solution matching
  if (
    lower.includes('ai') ||
    lower.includes('artificial intelligence') ||
    lower.includes('machine learning') ||
    lower.includes('copilot') ||
    lower.includes('gpt') ||
    lower.includes('llm') ||
    lower.includes('agent')
  ) {
    result.product_interest = 'Enterprise AI Platform';
  } else if (
    lower.includes('cloud') ||
    lower.includes('aws') ||
    lower.includes('azure') ||
    lower.includes('infrastructure') ||
    lower.includes('hosting') ||
    lower.includes('server') ||
    lower.includes('devops')
  ) {
    result.product_interest = 'Cloud Infrastructure & Security';
  } else if (
    lower.includes('analytics') ||
    lower.includes('crm') ||
    lower.includes('reporting') ||
    lower.includes('dashboard') ||
    lower.includes('bi') ||
    lower.includes('sales')
  ) {
    result.product_interest = 'Smart Analytics & CRM Suite';
  } else if (
    lower.includes('cyber') ||
    lower.includes('security') ||
    lower.includes('compliance') ||
    lower.includes('firewall') ||
    lower.includes('penetration') ||
    lower.includes('soc')
  ) {
    result.product_interest = 'Cybersecurity & Compliance';
  } else if (
    lower.includes('custom') ||
    lower.includes('outsourcing') ||
    lower.includes('development') ||
    lower.includes('software services') ||
    lower.includes('app development')
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
    lower.includes('in 2 weeks') ||
    lower.includes('next week')
  ) {
    result.purchase_timeline = 'immediate';
  } else if (
    lower.includes('1 to 3 months') ||
    lower.includes('1-3 months') ||
    lower.includes('next quarter') ||
    lower.includes('next month') ||
    lower.includes('few months')
  ) {
    result.purchase_timeline = '1-3 months';
  } else if (
    lower.includes('3 to 6 months') ||
    lower.includes('3-6 months') ||
    lower.includes('mid year')
  ) {
    result.purchase_timeline = '3-6 months';
  } else if (
    lower.includes('6 to 12 months') ||
    lower.includes('next year') ||
    lower.includes('annual')
  ) {
    result.purchase_timeline = '6-12 months';
  }

  // 6. Name and Company Extraction
  // Pattern A: "met [Name] from [Company]" or "spoke with [Name] at [Company]"
  const metPattern = /(?:met|spoke with|speaking with|talking to|visitor is|contact is)\s+((?:(?:dr\.|dr|mr\.|mr|ms\.|ms|eng\.|eng|sheikh)\s+)?[a-z\.\'\-]+(?:\s+[a-z\.\'\-]+){1,3})\s+(?:from|at|with|works for|working at)\s+([a-z0-9\.\'\-&]+(?:\s+[a-z0-9\.\'\-&]+){0,4})/i;
  const matchMet = text.match(metPattern);

  if (matchMet) {
    let rawName = matchMet[1].trim();
    const cleanName = rawName.replace(/^(?:dr\.|dr|mr\.|mr|ms\.|ms|eng\.|eng|sheikh)\s+/i, '');
    const nameParts = cleanName.split(/\s+/);
    result.first_name = capitalizeWords(nameParts[0]);
    result.last_name = capitalizeWords(nameParts.slice(1).join(' ') || 'Visitor');
    result.full_name = capitalizeWords(cleanName);
    result.company = capitalizeWords(matchMet[2].trim().replace(/[.,;]$/, ''));
  } else {
    // Pattern B: "name is [Name] ... company is [Company]"
    const nameOnlyPattern = /(?:name is|called|visitor name is|rep is)\s+((?:(?:dr\.|dr|mr\.|mr|ms\.|ms|eng\.|eng|sheikh)\s+)?[a-z\.\'\-]+(?:\s+[a-z\.\'\-]+){1,3})/i;
    const nameMatch = text.match(nameOnlyPattern);
    if (nameMatch) {
      let rawName = nameMatch[1].trim();
      const cleanName = rawName.replace(/^(?:dr\.|dr|mr\.|mr|ms\.|ms|eng\.|eng|sheikh)\s+/i, '');
      const parts = cleanName.split(/\s+/);
      result.first_name = capitalizeWords(parts[0]);
      result.last_name = capitalizeWords(parts.slice(1).join(' ') || 'Visitor');
      result.full_name = capitalizeWords(cleanName);
    }

    const companyOnlyPattern = /(?:company is|organization is|working at|works for|from company|from)\s+([a-z0-9\.\'\-&]+(?:\s+[a-z0-9\.\'\-&]+){0,4})/i;
    const compMatch = text.match(companyOnlyPattern);
    if (compMatch) {
      const candidateComp = compMatch[1].trim().replace(/[.,;]$/, '');
      // Avoid matching generic stop words
      if (!/^(the|a|an|him|her|them|urgent|hot|cold|immediate)$/i.test(candidateComp)) {
        result.company = capitalizeWords(candidateComp);
      }
    }
  }

  // 7. Job Title Extraction
  const titlePatterns = [
    /(?:is|as)\s+(?:a|the)\s+([a-z\s]+?(?:director|manager|officer|vp|vice president|head of [a-z\s]+|cto|ceo|cfo|cmo|coo|founder|partner|consultant|engineer|specialist|lead|architect))/i,
    /\b(chief executive officer|chief technology officer|chief operating officer|managing director|general manager|vice president|head of [a-z\s]+|director of [a-z\s]+|sales manager|solution architect|senior engineer|marketing director|cto|ceo|cfo|cmo|coo|vp)\b/i,
  ];

  for (const pat of titlePatterns) {
    const titleMatch = text.match(pat);
    if (titleMatch) {
      result.job_title = capitalizeWords(titleMatch[1].trim());
      break;
    }
  }

  // 8. Follow-up Date
  if (lower.includes('tomorrow')) {
    result.followup_date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  } else if (lower.includes('in 2 days') || lower.includes('in two days')) {
    result.followup_date = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
  } else if (lower.includes('in 3 days') || lower.includes('in three days')) {
    result.followup_date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
  } else if (lower.includes('next week') || lower.includes('in a week')) {
    result.followup_date = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
  }

  // 9. Requirement / Clean Spoken Notes
  result.requirement = text;

  return result;
}
