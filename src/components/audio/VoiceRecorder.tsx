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
  FileText,
  RotateCcw,
  Zap,
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);

  // Natural Language Transcript states
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [extractedLead, setExtractedLead] = useState<ParsedNaturalLanguageLead | null>(null);

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

  // Start combined Audio Recording + Live Speech-to-Text
  const startRecording = async () => {
    try {
      setTranscript('');
      setInterimText('');
      setExtractedLead(null);
      audioChunksRef.current = [];

      // 1. Microphone Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        recordedBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // 2. Concurrent Speech Recognition (Natural Language Transcribe)
      if (isSpeechRecognitionSupported()) {
        const recognizer = createSpeechRecognizer({
          continuous: true,
          interimResults: true,
          onResult: (finalText, interim) => {
            const combined = finalText || interim;
            setTranscript(finalText);
            setInterimText(interim);
            if (combined) {
              onTranscriptChange?.(combined);
              const parsed = parseNaturalLanguageText(combined);
              setExtractedLead(parsed);
            }
          },
          onError: (err) => {
            console.warn('Speech recognition warning:', err);
          },
        });

        if (recognizer) {
          recognizerRef.current = recognizer;
          recognizer.start();
        }
      }

      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access was denied or not supported in this browser.');
    }
  };

  // Stop recording & finalize transcription
  const stopRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      recognizerRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Toggle Recorded Audio Playback
  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      stopSpeaking();
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Text-to-Speech (Convert Text Information to Voice Note)
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

  // Save the voice note & transcript
  const handleSaveVoiceNote = () => {
    const finalNoteText = transcript.trim() || `🎙️ Voice Note (${formatTime(recordingDuration)})`;
    const parsed = extractedLead || parseNaturalLanguageText(finalNoteText);
    onAudioRecorded(recordedBlobRef.current, recordingDuration, finalNoteText, parsed);
    resetRecording();
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    stopSpeaking();
    setAudioUrl(null);
    recordedBlobRef.current = null;
    setRecordingDuration(0);
    setIsPlayingAudio(false);
    setIsSpeakingTTS(false);
    setTranscript('');
    setInterimText('');
    setExtractedLead(null);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="p-3.5 bg-gradient-to-br from-slate-50 to-brand-50/40 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Natural Language Voice Note
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
          {formatTime(recordingDuration)}
        </span>
      </div>

      {/* Recording Trigger or Active Pulse */}
      {!audioUrl && (
        <div className="space-y-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-teal-700 hover:from-brand-700 hover:to-teal-800 text-white text-xs font-bold transition shadow-md shadow-brand-500/20 active:scale-[0.99]"
            >
              <Mic className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span>Record & Transcribe Voice Note</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-md shadow-rose-500/30 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording ({formatTime(recordingDuration)})</span>
              </button>

              {/* Live Speech Recognition Feedback */}
              <div className="p-2.5 bg-white/90 rounded-xl border border-brand-200/80 text-xs">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Listening (Natural Language)...
                </span>
                <p className="text-slate-800 italic font-medium leading-relaxed">
                  {transcript} {interimText ? <span className="text-slate-400">{interimText}</span> : null}
                  {!transcript && !interimText && 'Speak clearly into the microphone...'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recording Complete: Playback, Transcript & Actions */}
      {audioUrl && (
        <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
          {/* Audio Player Controls */}
          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
            <button
              type="button"
              onClick={toggleAudioPlayback}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingAudio ? 'Pause Audio' : 'Play Audio Recording'}</span>
            </button>

            {/* Convert to Voice Note (Text-to-Speech) */}
            {isSpeechSynthesisSupported() && transcript && (
              <button
                type="button"
                onClick={handlePlayTTS}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md transition ${
                  isSpeakingTTS
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                title="Speak text aloud"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{isSpeakingTTS ? 'Stop Voice Note' : 'Voice Note (TTS)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={resetRecording}
              className="p-1 text-slate-400 hover:text-rose-600 transition"
              title="Discard & Re-record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Transcribed Natural Language Text */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Transcribed Speech Note:</span>
              <span className="text-brand-600 font-bold">Editable</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => {
                const val = e.target.value;
                setTranscript(val);
                onTranscriptChange?.(val);
                if (val) setExtractedLead(parseNaturalLanguageText(val));
              }}
              rows={2}
              placeholder="No words transcribed. You can also type notes here..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800"
            />
          </div>

          {/* AI Extracted Information Preview */}
          {extractedLead && (extractedLead.rating || extractedLead.company || extractedLead.email) && (
            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Natural Language Lead Insights
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px] pt-0.5">
                {extractedLead.rating && (
                  <span className="px-2 py-0.5 rounded-full bg-white font-bold text-slate-800 border border-teal-200">
                    Rating: {extractedLead.rating.toUpperCase()}
                  </span>
                )}
                {extractedLead.company && (
                  <span className="px-2 py-0.5 rounded-full bg-white font-bold text-slate-800 border border-teal-200">
                    Org: {extractedLead.company}
                  </span>
                )}
                {extractedLead.product_interest && (
                  <span className="px-2 py-0.5 rounded-full bg-white font-bold text-slate-800 border border-teal-200">
                    Interest: {extractedLead.product_interest}
                  </span>
                )}
                {extractedLead.followup_date && (
                  <span className="px-2 py-0.5 rounded-full bg-white font-bold text-slate-800 border border-teal-200">
                    Follow-up: {extractedLead.followup_date}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Save Action */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetRecording}
              className="flex-1 text-xs"
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveVoiceNote}
              className="flex-[2] text-xs font-bold gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Voice Note to Lead</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
