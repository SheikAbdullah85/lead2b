'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  VolumeX,
  Play,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  createSpeechRecognizer,
  SpeechRecognizerController,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  parseNaturalLanguageText,
  ParsedNaturalLanguageLead,
} from '@/lib/utils/speech';

interface NaturalLanguageVoiceInputProps {
  onApplyExtractedData: (data: ParsedNaturalLanguageLead) => void;
  className?: string;
  defaultExpanded?: boolean;
}

const SAMPLE_VOICE_PROMPTS = [
  'Met Dr. Sarah Jenkins from Cleveland Clinic Abu Dhabi, VP of Health. Email is sarah.j@clevelandclinic.ae, phone 0501234567. Very hot lead, urgent request for Enterprise AI Platform within 1 month.',
  'Spoke with Tariq Mansoor at ADNOC Distribution, Head of Operations. Contact tariq.m@adnoc.ae. Warm lead looking for Cloud Infrastructure & Security next quarter.',
  'Met Fatima Al Zaabi from Dubai Health Authority, Director of IT. Email fatima@dha.gov.ae. Immediate buying timeline for Smart Analytics & CRM Suite. High priority VIP contact.',
];

export function NaturalLanguageVoiceInput({
  onApplyExtractedData,
  className = '',
  defaultExpanded = true,
}: NaturalLanguageVoiceInputProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [extractedData, setExtractedData] = useState<ParsedNaturalLanguageLead | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  useEffect(() => {
    setBrowserSupported(isSpeechRecognitionSupported());
    return () => {
      stopSpeaking();
      recognizerRef.current?.abort();
    };
  }, []);

  const handleStartListening = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Safari or Edge, or use the "Try Sample" button.');
      return;
    }

    stopSpeaking();
    setIsPlayingTTS(false);
    setTranscript('');
    setInterimText('');
    setExtractedData(null);

    const recognizer = createSpeechRecognizer({
      continuous: true,
      interimResults: true,
      onResult: (finalText, interim) => {
        setTranscript(finalText);
        setInterimText(interim);
        const combined = (finalText + ' ' + interim).trim();
        if (combined.length > 5) {
          const parsed = parseNaturalLanguageText(combined);
          setExtractedData(parsed);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  const handleStopListening = () => {
    recognizerRef.current?.stop();
    setIsListening(false);
    const textToProcess = (transcript + ' ' + interimText).trim();
    if (textToProcess) {
      const parsed = parseNaturalLanguageText(textToProcess);
      setExtractedData(parsed);
      onApplyExtractedData(parsed);
    }
  };

  const handleApplyNow = () => {
    if (extractedData) {
      onApplyExtractedData(extractedData);
    }
  };

  const handlePlayVoiceNote = () => {
    if (isPlayingTTS) {
      stopSpeaking();
      setIsPlayingTTS(false);
      return;
    }

    const textToSpeak = transcript || (extractedData ? extractedData.raw_transcript : '');
    if (!textToSpeak) return;

    setIsPlayingTTS(true);
    speakText(textToSpeak, {
      onEnd: () => setIsPlayingTTS(false),
      onError: () => setIsPlayingTTS(false),
    });
  };

  const handleApplySample = (sampleText: string) => {
    stopSpeaking();
    setIsPlayingTTS(false);
    setTranscript(sampleText);
    setInterimText('');
    const parsed = parseNaturalLanguageText(sampleText);
    setExtractedData(parsed);
    onApplyExtractedData(parsed);
  };

  const handleClear = () => {
    stopSpeaking();
    recognizerRef.current?.abort();
    setIsListening(false);
    setIsPlayingTTS(false);
    setTranscript('');
    setInterimText('');
    setExtractedData(null);
  };

  return (
    <div
      className={`rounded-2xl border border-brand-200/90 bg-gradient-to-br from-brand-50/70 via-indigo-50/40 to-white shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner Header */}
      <div className="p-3.5 flex items-center justify-between gap-2 border-b border-brand-100/60 bg-white/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse text-amber-300' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Voice Dictation & NLP</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Speech-to-Lead
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Speak naturally to auto-fill visitor details & convert notes to voice audio
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label={isExpanded ? 'Collapse voice dictation' : 'Expand voice dictation'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Main Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {!isListening ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartListening}
                className="font-bold text-xs shadow-xs"
              >
                <Mic className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                Start Speaking
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleStopListening}
                className="font-bold text-xs animate-pulse shadow-xs"
              >
                <MicOff className="w-3.5 h-3.5 mr-1" />
                Done Speaking (Auto-Extract)
              </Button>
            )}

            {(transcript || extractedData) && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePlayVoiceNote}
                  className="font-bold text-xs"
                >
                  {isPlayingTTS ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse" />
                      Stop Voice Note
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                      Play Spoken Voice Note
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyNow}
                  className="font-bold text-xs text-brand-700 border-brand-300 hover:bg-brand-50"
                >
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Apply to Form
                </Button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1.5 transition ml-auto"
                  title="Clear text"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Listening Indicator / Audio Waveform visual */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50/90 border border-rose-200/80 rounded-xl animate-in fade-in-50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold text-rose-900">
                Listening... Speak details (e.g. &ldquo;Met Dr. Sarah from Cleveland Clinic, VP of Health, email sarah@clinic.ae, hot lead...&rdquo;)
              </span>
            </div>
          )}

          {/* Live Streaming Speech Transcript Display */}
          {(transcript || interimText) && (
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-800 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Spoken Voice Transcript:</span>
                {extractedData && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Extracted & Applied
                  </span>
                )}
              </div>
              <p className="leading-relaxed">
                <span>{transcript}</span>
                {interimText && <span className="text-slate-400 italic"> {interimText}</span>}
              </p>
            </div>
          )}

          {/* Extracted NLP Lead Attributes Pill Badges */}
          {extractedData && (
            <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-600" />
                <span>Extracted Lead Attributes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {extractedData.first_name && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                    👤 {extractedData.first_name} {extractedData.last_name || ''}
                  </span>
                )}
                {extractedData.company && (
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    🏢 {extractedData.company}
                  </span>
                )}
                {extractedData.job_title && (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                    💼 {extractedData.job_title}
                  </span>
                )}
                {extractedData.email && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    ✉️ {extractedData.email}
                  </span>
                )}
                {extractedData.mobile && (
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                    📞 {extractedData.mobile}
                  </span>
                )}
                {extractedData.rating && (
                  <span
                    className={`px-2 py-0.5 rounded-lg font-bold border ${
                      extractedData.rating === 'hot'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : extractedData.rating === 'warm'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    }`}
                  >
                    {extractedData.rating === 'hot'
                      ? '🔥 Hot Lead'
                      : extractedData.rating === 'warm'
                      ? '☀️ Warm Lead'
                      : '❄️ Cold Lead'}
                  </span>
                )}
                {extractedData.product_interest && (
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200">
                    🎯 {extractedData.product_interest}
                  </span>
                )}
                {extractedData.purchase_timeline && (
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200">
                    ⏳ {extractedData.purchase_timeline}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Sample Voice Prompts for Rapid Testing / No-Mic Situations */}
          <div className="pt-1 border-t border-brand-100/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Try Sample Voice Notes (Instant Test):
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_VOICE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(prompt)}
                  className="text-left p-2 rounded-lg bg-white/80 hover:bg-white text-[11px] text-slate-700 border border-slate-200/80 hover:border-brand-300 transition flex items-center justify-between group"
                >
                  <span className="line-clamp-1 italic font-medium">&ldquo;{prompt}&rdquo;</span>
                  <span className="text-[10px] text-brand-600 font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap ml-2 flex items-center gap-0.5">
                    <Play className="w-2.5 h-2.5" /> Test NLP
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
