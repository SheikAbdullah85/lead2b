import React from 'react';
import { CheckCircle2, Clock, MessageSquare, PhoneCall, Send, ShieldAlert, Sparkles } from 'lucide-react';

export interface TimelineItem {
  id: string;
  type: 'capture' | 'rating' | 'note' | 'followup' | 'crm' | 'status';
  title: string;
  description?: string;
  timestamp: string;
  author?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  const getIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'capture':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'note':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      case 'followup':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'crm':
        return <Send className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item) => (
        <div key={item.id} className="relative group">
          <div className="absolute -left-6 mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm">
            {getIcon(item.type)}
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{item.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-slate-600 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.description}
              </p>
            )}
            {item.author && (
              <span className="text-[10px] text-slate-400 block mt-0.5">by {item.author}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
