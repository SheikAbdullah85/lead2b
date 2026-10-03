'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_FORM } from '@/lib/data/mock-store';
import { FormQuestion } from '@/lib/types';
import { Sliders, Plus, Trash2, Edit2, GitBranch, Eye, CheckCircle, Sparkles, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ExhibitorFormsPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [questions, setQuestions] = useState<FormQuestion[]>(INITIAL_FORM.questions || []);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({
    'qqqq0003-0000-0000-0000-000000000003': 'Yes',
  });

  // Load custom questions on mount from localStorage & Supabase
  const loadQuestions = async () => {
    try {
      let storedList: FormQuestion[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_custom_questions');
        if (stored) {
          try {
            storedList = JSON.parse(stored);
          } catch (e) {}
        }
      }

      if (storedList.length > 0) {
        setQuestions(storedList);
        return;
      }

      // Check Supabase if online
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: dbQuestions } = await supabase
          .from('form_questions')
          .select('*, form_options(*)')
          .order('display_order', { ascending: true });

        if (dbQuestions && dbQuestions.length > 0) {
          const mapped: FormQuestion[] = dbQuestions.map((q: any) => ({
            id: q.id,
            form_id: q.form_id || form.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            display_order: q.display_order,
            conditional_parent_id: q.conditional_parent_id,
            conditional_operator: q.conditional_operator,
            conditional_value: q.conditional_value,
            options: q.form_options?.map((opt: any) => ({
              id: opt.id,
              question_id: opt.question_id,
              option_label: opt.option_label,
              option_value: opt.option_value,
              display_order: opt.display_order,
            })),
          }));
          setQuestions(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lead2b_custom_questions', JSON.stringify(mapped));
          }
          return;
        }
      }

      // Fallback to default mock form questions
      const initial = INITIAL_FORM.questions || [];
      setQuestions(initial);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_custom_questions', JSON.stringify(initial));
      }
    } catch (err) {
      console.warn('Error hydrating questions:', err);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // New question form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<FormQuestion['question_type']>('dropdown');
  const [isRequired, setIsRequired] = useState(false);
  const [hasCondition, setHasCondition] = useState(false);
  const [conditionalParentId, setConditionalParentId] = useState('');
  const [conditionalValue, setConditionalValue] = useState('Yes');
  const [optionsText, setOptionsText] = useState('Option 1, Option 2, Option 3');

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSaving(true);
    const newQId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `q-${Date.now()}-0000-0000-000000000001`;

    const generatedOptions = ['dropdown', 'radio', 'checkbox', 'multi_select'].includes(questionType)
      ? optionsText.split(',').map((opt, i) => ({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `opt-${Date.now()}-${i}`,
          question_id: newQId,
          option_label: opt.trim(),
          option_value: opt.trim(),
          display_order: i + 1,
        }))
      : undefined;

    const newQuestion: FormQuestion = {
      id: newQId,
      form_id: form.id,
      question_text: questionText.trim(),
      question_type: questionType,
      is_required: isRequired,
      display_order: questions.length + 1,
      conditional_parent_id: hasCondition && conditionalParentId ? conditionalParentId : undefined,
      conditional_operator: hasCondition ? 'equals' : undefined,
      conditional_value: hasCondition ? conditionalValue.trim() : undefined,
      options: generatedOptions,
    };

    const updated = [...questions, newQuestion];
    setQuestions(updated);

    // Save to localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_custom_questions', JSON.stringify(updated));
      } catch (err) {}
    }

    // Save to Supabase if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('form_questions').insert([
          {
            id: newQuestion.id,
            form_id: form.id,
            question_text: newQuestion.question_text,
            question_type: newQuestion.question_type,
            is_required: newQuestion.is_required,
            display_order: newQuestion.display_order,
            conditional_parent_id: newQuestion.conditional_parent_id,
            conditional_operator: newQuestion.conditional_operator,
            conditional_value: newQuestion.conditional_value,
          },
        ]);

        if (generatedOptions && generatedOptions.length > 0) {
          await supabase.from('form_options').insert(
            generatedOptions.map((opt) => ({
              id: opt.id,
              question_id: newQId,
              option_label: opt.option_label,
              option_value: opt.option_value,
              display_order: opt.display_order,
            }))
          );
        }
      } catch (sbErr) {
        console.warn('Supabase form question insert notice:', sbErr);
      }
    }

    setIsSaving(false);
    setIsAddQuestionModalOpen(false);
    setQuestionText('');
    setHasCondition(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleDeleteQuestion = async (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_custom_questions', JSON.stringify(updated));
      } catch (e) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('form_questions').delete().eq('id', id);
      } catch (e) {}
    }
  };

  // Evaluate conditional logic for preview
  const isQuestionVisible = (q: FormQuestion): boolean => {
    if (!q.conditional_parent_id) return true;
    const parentAnswer = previewAnswers[q.conditional_parent_id];
    return parentAnswer === q.conditional_value;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Sliders className="w-3 h-3 text-brand-600" />
            Lead Qualification Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Qualification Form Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure custom qualification questions, scoring criteria, and branching logic for booth sales reps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedBanner && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved Persistently
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadQuestions}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Reload questions"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Reload</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddQuestionModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Question</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Questions Management */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-black">{form.form_name}</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">{form.description}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Default Form ({questions.length} Questions)
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {questions.map((q, index) => {
                const isConditional = !!q.conditional_parent_id;
                const parentQ = questions.find((item) => item.id === q.conditional_parent_id);

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition ${
                      isConditional
                        ? 'bg-amber-50/40 border-amber-200/80 ml-4 sm:ml-6 relative'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:border-brand-300'
                    }`}
                  >
                    {isConditional && (
                      <div className="absolute -left-3 sm:-left-4 top-6 w-3 sm:w-4 h-0.5 bg-amber-400" />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-800 text-[10px] font-black flex items-center justify-center border border-brand-200/60">
                            {index + 1}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 leading-snug">{q.question_text}</h4>
                          {q.is_required && <span className="text-rose-500 font-black text-xs">*</span>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2 ml-7">
                          <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {q.question_type}
                          </span>

                          {isConditional && parentQ && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              <GitBranch className="w-3 h-3 text-amber-600" />
                              Only shows if: &ldquo;{parentQ.question_text}&rdquo; = &ldquo;{q.conditional_value}&rdquo;
                            </span>
                          )}
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 ml-7">
                            {q.options.map((opt) => (
                              <span
                                key={opt.id}
                                className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {opt.option_label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Interactive Smartphone Simulator */}
        <div>
          <Card className="sticky top-20 border-brand-200 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-brand-50 to-brand-100/50 border-b border-brand-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-black text-brand-900 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>Live Sales Rep Mobile Preview</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Test conditional branches as reps qualify visitors
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {questions.map((q) => {
                const visible = isQuestionVisible(q);
                if (!visible) return null;

                return (
                  <div key={q.id} className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-slate-800">
                      {q.question_text} {q.is_required && <span className="text-rose-500 font-bold">*</span>}
                    </label>

                    {q.question_type === 'yes_no' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {['Yes', 'No'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: val })}
                            className={`py-2 text-xs font-black rounded-xl border transition ${
                              previewAnswers[q.id] === val
                                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    ) : q.options ? (
                      <select
                        value={previewAnswers[q.id] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                        className="w-full text-xs h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                      >
                        <option value="">Select option...</option>
                        {q.options.map((opt) => (
                          <option key={opt.id} value={opt.option_value}>
                            {opt.option_label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter value..."
                        className="w-full text-xs h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Custom Question Modal */}
      <Modal
        isOpen={isAddQuestionModalOpen}
        onClose={() => setIsAddQuestionModalOpen(false)}
        title="Add Qualification Question"
        description="Configure question type, options, and conditional logic"
      >
        <form onSubmit={handleAddQuestion} className="space-y-3.5">
          <Input
            label="Question Label"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Budget Approval Status"
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="dropdown">Dropdown (Single Selection)</option>
              <option value="radio">Radio Buttons</option>
              <option value="yes_no">Yes / No Toggle</option>
              <option value="short_text">Short Text</option>
              <option value="long_text">Long Text / Notes</option>
              <option value="number">Numeric Value</option>
              <option value="currency">Budget / Currency (USD)</option>
              <option value="date">Target Date</option>
            </select>
          </div>

          {['dropdown', 'radio', 'checkbox', 'multi_select'].includes(questionType) && (
            <Input
              label="Options (Comma separated)"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder="Tier 1, Tier 2, Tier 3"
            />
          )}

          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCondition}
                onChange={(e) => setHasCondition(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Enable Conditional Logic (Branching)</span>
            </label>

            {hasCondition && (
              <div className="mt-3 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Show only if parent question:</label>
                  <select
                    value={conditionalParentId}
                    onChange={(e) => setConditionalParentId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-amber-300 bg-white px-3 font-medium text-slate-800"
                  >
                    <option value="">Select parent question...</option>
                    {questions.map((q) => (
                      <option key={q.id} value={q.id}>{q.question_text}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-amber-950 mb-1">Equals answer value:</label>
                  <input
                    type="text"
                    value={conditionalValue}
                    onChange={(e) => setConditionalValue(e.target.value)}
                    placeholder="e.g. Yes"
                    className="w-full h-10 rounded-xl border border-amber-300 bg-white px-3 font-medium text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddQuestionModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
