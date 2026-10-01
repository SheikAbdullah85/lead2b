'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  createSpeechRecognizer,
  SpeechRecognizerController,
  isSpeechRecognitionSupported,
  parseNaturalLanguageText,
  ParsedNaturalLanguageLead,
} from '@/lib/utils/speech';

interface NaturalLanguageVoiceInputProps {
  onApplyExtractedData: (data: ParsedNaturalLanguageLead) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export function NaturalLanguageVoiceInput({
  onApplyExtractedData,
  className = '',
}: NaturalLanguageVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [extractedData, setExtractedData] = useState<ParsedNaturalLanguageLead | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  const handleStartListening = () => {
    setSpeechError(null);

    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari on your device.'
      );
      return;
    }

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
    const textToProcess = (transcript + ' ' + interimText).trim();
    if (textToProcess) {
      const parsed = extractedData || parseNaturalLanguageText(textToProcess);
      onApplyExtractedData(parsed);
    }
  };

  const handleClear = () => {
    recognizerRef.current?.abort();
    setIsListening(false);
    setSpeechError(null);
    setTranscript('');
    setInterimText('');
    setExtractedData(null);
  };

  return (
    <div
      className={`rounded-2xl border border-teal-200/80 bg-white p-3.5 shadow-2xs space-y-3 ${className}`}
    >
      {/* Sleek Action Bar with Prominent "Start Speaking" Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isListening ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleStartListening}
            className="w-full sm:w-auto font-black text-xs shadow-md bg-gradient-to-r from-[#006d77] to-[#00838f] text-white hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <Mic className="w-4 h-4 text-cyan-200" />
            <span>Start Speaking</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleStopListening}
            className="w-full sm:w-auto font-black text-xs animate-pulse shadow-md flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <MicOff className="w-4 h-4" />
            <span>Done Speaking (Apply to Form)</span>
          </Button>
        )}

        {transcript.trim() && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyNow}
              className="font-bold text-xs text-teal-800 border-teal-300 hover:bg-teal-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>Apply to Form</span>
            </Button>

            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-600 p-1.5 transition cursor-pointer"
              title="Clear text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {speechError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="leading-snug text-[11px] text-amber-800">{speechError}</p>
        </div>
      )}

      {/* Active Listening Pulse Indicator */}
      {isListening && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50/90 border border-rose-200/80 rounded-xl animate-in fade-in-50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold text-rose-900 flex-1">
            Listening... Speak visitor name, company, email, mobile, and notes.
          </span>
        </div>
      )}

      {/* Live Transcript Display */}
      {(transcript || isListening) && (
        <div>
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
            placeholder="Dictated notes will appear here in real-time..."
            className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-800"
          />
          {interimText && (
            <p className="text-[11px] text-slate-400 italic mt-0.5 px-1 truncate">
              Listening: &ldquo;{interimText}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Extracted NLP Lead Attributes Preview Chips */}
      {extractedData &&
        (extractedData.full_name ||
          extractedData.company ||
          extractedData.email ||
          extractedData.mobile ||
          extractedData.rating) && (
          <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200 shadow-2xs space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-black">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>Extracted Lead Attributes</span>
              </span>
              <span className="text-[10px] text-teal-700 font-bold">Auto-Detected</span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {extractedData.full_name && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-semibold text-slate-800 text-[11px]">
                  👤 {extractedData.full_name}
                </span>
              )}
              {extractedData.job_title && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-medium text-slate-700 text-[11px]">
                  💼 {extractedData.job_title}
                </span>
              )}
              {extractedData.company && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-semibold text-slate-800 text-[11px]">
                  🏢 {extractedData.company}
                </span>
              )}
              {extractedData.email && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-mono text-[10px] text-teal-800">
                  ✉️ {extractedData.email}
                </span>
              )}
              {extractedData.mobile && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-mono text-[10px] text-teal-800">
                  📱 {extractedData.mobile}
                </span>
              )}
              {extractedData.rating && (
                <span
                  className={`px-2 py-0.5 rounded-md font-black uppercase text-[10px] tracking-wide ${
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
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 font-medium text-slate-700 text-[11px]">
                  🎯 {extractedData.product_interest}
                </span>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
