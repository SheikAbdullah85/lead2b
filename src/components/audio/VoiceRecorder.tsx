'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Check,
  Volume2,
  Sparkles,
  VolumeX,
  AlertCircle,
  FileAudio,
  Radio,
  FileText,
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

interface VoiceRecorderProps {
  onAudioRecorded: (
    audioBlob: Blob | null,
    durationSeconds: number,
    transcribedText?: string,
    extractedData?: ParsedNaturalLanguageLead
  ) => void;
  onTranscriptChange?: (text: string) => void;
}

export function VoiceRecorder({ onAudioRecorded, onTranscriptChange }: VoiceRecorderProps) {
  // Mode selection: 'dictation' | 'memo'
  const [activeMode, setActiveMode] = useState<'dictation' | 'memo'>('dictation');
  
  // Audio Memo Recording state
  const [isRecordingMemo, setIsRecordingMemo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // AI Speech Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [extractedLead, setExtractedLead] = useState<ParsedNaturalLanguageLead | null>(null);
  
  // TTS (Text Information to Voice Note)
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopSpeaking();
      recognizerRef.current?.abort();
    };
  }, [audioUrl]);

  // ----------------------------------------------------
  // 1. Audio Voice Memo Recording (MediaRecorder)
  // ----------------------------------------------------
  const startMemoRecording = async () => {
    setErrorMessage(null);
    stopSpeaking();
    setIsSpeakingTTS(false);

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine cross-browser supported mimeType (iOS Safari vs Chrome)
      let options: MediaRecorderOptions = {};
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg',
      ];
      for (const mime of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
          options = { mimeType: mime };
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = options.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        recordedBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecordingMemo(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceMemo] Access error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access.'
          : 'Unable to initialize microphone on this device.'
      );
    }
  };

  const stopMemoRecording = () => {
    if (isRecordingMemo && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecordingMemo(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // ----------------------------------------------------
  // 2. AI Speech Dictation (SpeechRecognition + NLP)
  // ----------------------------------------------------
  const startDictation = () => {
    setErrorMessage(null);
    stopSpeaking();
    setIsSpeakingTTS(false);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Safari or Edge.');
      return;
    }

    const recognizer = createSpeechRecognizer({
      continuous: true,
      interimResults: true,
      onResult: (finalText, interim) => {
        const combined = (finalText ? finalText + ' ' + interim : interim).trim();
        setTranscript(finalText);
        setInterimText(interim);
        if (combined) {
          onTranscriptChange?.(combined);
          const parsed = parseNaturalLanguageText(combined);
          setExtractedLead(parsed);
        }
      },
      onError: (friendlyError) => {
        setErrorMessage(friendlyError);
        setIsDictating(false);
      },
      onStart: () => setIsDictating(true),
      onEnd: () => setIsDictating(false),
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  const stopDictation = () => {
    recognizerRef.current?.stop();
    setIsDictating(false);
    const textToProcess = (transcript + ' ' + interimText).trim();
    if (textToProcess) {
      setTranscript(textToProcess);
      setInterimText('');
      const parsed = parseNaturalLanguageText(textToProcess);
      setExtractedLead(parsed);
    }
  };

  // ----------------------------------------------------
  // 3. Text to Voice Note (Speech Synthesis Audio Playback)
  // ----------------------------------------------------
  const handlePlayTTS = () => {
    const textToSpeak = transcript.trim();
    if (!textToSpeak) return;

    if (isSpeakingTTS) {
      stopSpeaking();
      setIsSpeakingTTS(false);
      return;
    }

    if (audioPlayerRef.current && isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }

    setIsSpeakingTTS(true);
    speakText(textToSpeak, {
      onEnd: () => setIsSpeakingTTS(false),
      onError: () => setIsSpeakingTTS(false),
    });
  };

  // ----------------------------------------------------
  // 4. Save Actions
  // ----------------------------------------------------
  const handleSaveVoiceNote = () => {
    const finalNoteText =
      transcript.trim() ||
      (audioUrl
        ? `🎙️ [Voice Memo: ${formatTime(recordingDuration)} audio note recorded at booth]`
        : '🎙️ [Spoken Audio Note]');
    const parsed = extractedLead || parseNaturalLanguageText(finalNoteText);
    onAudioRecorded(recordedBlobRef.current, recordingDuration, finalNoteText, parsed);
    resetAll();
  };

  const resetAll = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    stopSpeaking();
    recognizerRef.current?.abort();
    setAudioUrl(null);
    recordedBlobRef.current = null;
    setRecordingDuration(0);
    setIsPlayingAudio(false);
    setIsSpeakingTTS(false);
    setIsRecordingMemo(false);
    setIsDictating(false);
    setTranscript('');
    setInterimText('');
    setExtractedLead(null);
    setErrorMessage(null);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00838f] text-white flex items-center justify-center shadow-xs">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Natural Language Voice Engine
            </h4>
            <p className="text-[11px] text-slate-500">
              Dictate speech to text, record raw voice memos, or convert text to voice audio
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-200/70 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              resetAll();
              setActiveMode('dictation');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'dictation'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#00838f]" />
            <span>AI Dictation</span>
          </button>
          <button
            type="button"
            onClick={() => {
              resetAll();
              setActiveMode('memo');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'memo'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileAudio className="w-3 h-3 text-teal-600" />
            <span>Voice Memo</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MODE 1: AI Speech Dictation & Text Conversion */}
      {activeMode === 'dictation' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isDictating ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={startDictation}
                className="font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-200" />
                <span>Start AI Dictation</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={stopDictation}
                className="font-bold text-xs animate-pulse shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop Dictation (Process NLP)</span>
              </Button>
            )}

            {/* Convert to Voice Audio Button */}
            {transcript.trim() && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handlePlayTTS}
                className="font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSpeakingTTS ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span>Stop Voice Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#00838f]" />
                    <span>Convert to Voice Note (Listen)</span>
                  </>
                )}
              </Button>
            )}

            {(transcript || isDictating) && (
              <button
                type="button"
                onClick={resetAll}
                className="p-1.5 text-xs text-slate-400 hover:text-rose-600 transition ml-auto cursor-pointer"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Listening Indicator */}
          {isDictating && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center gap-2 text-rose-900 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>
                Listening in real-time... Speak visitor notes, requirements, and budget details.
              </span>
            </div>
          )}

          {/* Transcript Textarea (Editable) */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Transcribed Note Text:</span>
              <span className="text-[#00838f] font-bold">Type or Dictate</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => {
                const val = e.target.value;
                setTranscript(val);
                onTranscriptChange?.(val);
                if (val.trim()) setExtractedLead(parseNaturalLanguageText(val));
              }}
              rows={2}
              placeholder="Speak using the button above or type notes here to extract lead information..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 text-slate-800"
            />
            {interimText && (
              <p className="text-[11px] text-slate-400 italic mt-0.5 px-1">
                Streaming: &ldquo;{interimText}&rdquo;
              </p>
            )}
          </div>

          {/* Extracted NLP Lead Attributes Preview */}
          {extractedLead && (extractedLead.rating || extractedLead.company || extractedLead.email) && (
            <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00838f]" />
                <span>Extracted Lead Attributes</span>
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs pt-0.5">
                {extractedLead.rating && (
                  <span className="px-2 py-0.5 rounded-md bg-white font-bold text-slate-800 border border-teal-200 text-[10px]">
                    Rating: {extractedLead.rating.toUpperCase()}
                  </span>
                )}
                {extractedLead.company && (
                  <span className="px-2 py-0.5 rounded-md bg-white font-semibold text-slate-800 border border-teal-200 text-[10px]">
                    Org: {extractedLead.company}
                  </span>
                )}
                {extractedLead.product_interest && (
                  <span className="px-2 py-0.5 rounded-md bg-white font-medium text-slate-700 border border-teal-200 text-[10px]">
                    Interest: {extractedLead.product_interest}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          {transcript.trim() && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveVoiceNote}
                className="w-full text-xs font-bold gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Voice Note to Lead Profile</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Raw Audio Voice Memo Recording */}
      {activeMode === 'memo' && (
        <div className="space-y-3">
          {!audioUrl ? (
            <div className="space-y-2">
              {!isRecordingMemo ? (
                <button
                  type="button"
                  onClick={startMemoRecording}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-[#00838f] hover:from-teal-700 hover:to-[#006978] text-white text-xs font-bold transition shadow-md shadow-teal-700/20 active:scale-[0.99] cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>Record Booth Audio Memo</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopMemoRecording}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-md shadow-rose-500/30 animate-pulse cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording ({formatTime(recordingDuration)})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!audioPlayerRef.current) return;
                    if (isPlayingAudio) {
                      audioPlayerRef.current.pause();
                      setIsPlayingAudio(false);
                    } else {
                      audioPlayerRef.current.play();
                      setIsPlayingAudio(true);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#00838f] hover:underline cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingAudio ? 'Pause Playback' : 'Play Recorded Memo'}</span>
                </button>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {formatTime(recordingDuration)}
                </span>
                <button
                  type="button"
                  onClick={resetAll}
                  className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Discard"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveVoiceNote}
                className="w-full text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Audio Memo to Lead</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
