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
  AlertCircle,
  FileText,
  Radio,
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
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  useEffect(() => {
    setBrowserSupported(isSpeechRecognitionSupported());
    return () => {
      stopSpeaking();
      recognizerRef.current?.abort();
    };
  }, []);

  const handleStartListening = () => {
    setSpeechError(null);

    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        'Web Speech Recognition is not supported on this browser (supported on Chrome, Edge, Safari). You can type below or test with a sample voice prompt.'
      );
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
        const combined = (finalText ? finalText + ' ' + interim : interim).trim();
        if (combined.length > 5) {
          const parsed = parseNaturalLanguageText(combined);
          setExtractedData(parsed);
        }
      },
      onError: (friendlyError) => {
        setSpeechError(friendlyError);
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
        setSpeechError(null);
      },
      onEnd: () => {
        setIsListening(false);
      },
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
    const textToProcess = transcript.trim();
    if (textToProcess) {
      const parsed = extractedData || parseNaturalLanguageText(textToProcess);
      onApplyExtractedData(parsed);
    }
  };

  const handlePlayVoiceNote = () => {
    if (isPlayingTTS) {
      stopSpeaking();
      setIsPlayingTTS(false);
      return;
    }

    const textToSpeak = transcript.trim() || (extractedData ? extractedData.raw_transcript : '');
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
    setSpeechError(null);
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
    setSpeechError(null);
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
              <span className="text-xs font-black text-slate-900">AI Voice Dictation & Audio Note</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Natural Language
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Speak naturally to extract lead fields, or convert written notes into spoken voice audio
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
                className="font-bold text-xs shadow-xs cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                <span>Start Speaking</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleStopListening}
                className="font-bold text-xs animate-pulse shadow-xs cursor-pointer"
              >
                <MicOff className="w-3.5 h-3.5 mr-1" />
                <span>Done Speaking (Apply NLP)</span>
              </Button>
            )}

            {transcript.trim() && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePlayVoiceNote}
                  className="font-bold text-xs cursor-pointer"
                >
                  {isPlayingTTS ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 mr-1 text-rose-500 animate-pulse" />
                      <span>Stop Voice Note</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                      <span>Convert Text to Voice Audio</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyNow}
                  className="font-bold text-xs text-brand-700 border-brand-300 hover:bg-brand-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span>Apply to Form</span>
                </Button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1.5 transition ml-auto cursor-pointer"
                  title="Clear text"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Error Banner with Guided Recovery */}
          {speechError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5 animate-in fade-in-50">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Microphone / Speech Notice:</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">{speechError}</p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-700">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => handleApplySample(SAMPLE_VOICE_PROMPTS[0])}
                  className="text-[10px] font-bold bg-white text-brand-700 px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
                >
                  Load Sample Voice Dictation →
                </button>
              </div>
            </div>
          )}

          {/* Active Listening Waveform */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50/90 border border-rose-200/80 rounded-xl animate-in fade-in-50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-bold text-rose-900 flex-1">
                Listening... Speak naturally (e.g. &ldquo;Met Dr. Sarah from Cleveland Clinic, VP of Health, email sarah@clinic.ae, hot lead...&rdquo;)
              </span>
            </div>
          )}

          {/* Editable Transcript Display */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Voice Note Transcript:</span>
              <span className="text-brand-600 font-bold">Type or Speak</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => {
                const val = e.target.value;
                setTranscript(val);
                if (val.trim()) {
                  const parsed = parseNaturalLanguageText(val);
                  setExtractedData(parsed);
                }
              }}
              rows={2}
              placeholder="Speak using the button above, or type conversation details to auto-classify..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800"
            />
            {interimText && (
              <p className="text-[11px] text-slate-400 italic mt-0.5 px-1">
                Streaming: &ldquo;{interimText}&rdquo;
              </p>
            )}
          </div>

          {/* Extracted NLP Lead Attributes Pill Badges */}
          {extractedData && (extractedData.full_name || extractedData.company || extractedData.email || extractedData.rating) && (
            <div className="p-3 bg-white/95 rounded-xl border border-teal-200 shadow-2xs space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center justify-between">
                <span className="flex items-center gap-1 font-black">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>AI Extracted Lead Profile</span>
                </span>
                <span className="text-[10px] text-teal-600 font-bold">Ready to Apply</span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {extractedData.full_name && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-semibold text-slate-800">
                    👤 {extractedData.full_name}
                  </span>
                )}
                {extractedData.job_title && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-medium text-slate-700">
                    💼 {extractedData.job_title}
                  </span>
                )}
                {extractedData.company && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-semibold text-slate-800">
                    🏢 {extractedData.company}
                  </span>
                )}
                {extractedData.email && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-mono text-[11px] text-teal-800">
                    ✉️ {extractedData.email}
                  </span>
                )}
                {extractedData.mobile && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-mono text-[11px] text-teal-800">
                    📱 {extractedData.mobile}
                  </span>
                )}
                {extractedData.rating && (
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] tracking-wide ${
                      extractedData.rating === 'hot'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : extractedData.rating === 'warm'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                  >
                    🔥 Rating: {extractedData.rating}
                  </span>
                )}
                {extractedData.product_interest && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-medium text-slate-700">
                    🎯 {extractedData.product_interest}
                  </span>
                )}
                {extractedData.purchase_timeline && (
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-medium text-slate-700">
                    ⏱️ {extractedData.purchase_timeline}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sample Prompts Tray */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>Or try instant sample speech prompts:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {SAMPLE_VOICE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(prompt)}
                  className="p-2 text-left rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-[11px] text-slate-700 font-medium leading-snug line-clamp-2 transition hover:border-brand-300 cursor-pointer shadow-2xs"
                >
                  &ldquo;{prompt.substring(0, 75)}...&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
