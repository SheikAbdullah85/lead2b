'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob, durationSeconds: number) => void;
}

export function VoiceRecorder({ onAudioRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioRecorded(audioBlob, recordingDuration);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access was denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Voice Note</span>
        </span>
        <span className="text-xs font-mono font-semibold text-slate-500">
          {formatTime(recordingDuration)}
        </span>
      </div>

      {!audioUrl ? (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition shadow-sm"
            >
              <Mic className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 text-white text-xs font-bold transition shadow animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording ({formatTime(recordingDuration)})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <button
            type="button"
            onClick={togglePlayback}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play Note'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{formatTime(recordingDuration)}</span>
            <button
              type="button"
              onClick={resetRecording}
              className="p-1 hover:text-red-500 transition"
              title="Delete recording"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
