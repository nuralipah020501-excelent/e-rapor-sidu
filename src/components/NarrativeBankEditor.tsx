import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_NARRATIVE_BANK, PREDICATE_LABELS } from '../data/defaultData';
import type { ElementBank, ElementKey, Predicate } from '../types/rapor';

interface NarrativeBankEditorProps {
  narrativeBank: ElementBank[];
  onChangeBank: (next: ElementBank[]) => void;
}

const PREDICATES: Predicate[] = ['BB', 'MB', 'BSH', 'BSB'];

export const NarrativeBankEditor: React.FC<NarrativeBankEditorProps> = ({
  narrativeBank,
  onChangeBank,
}) => {
  const [selectedEl, setSelectedEl] = useState<ElementKey>('agama');

  const activeBank =
    narrativeBank.find((b) => b.id === selectedEl) || narrativeBank[0];

  const updateActiveBank = (updater: (prev: ElementBank) => ElementBank) => {
    onChangeBank(
      narrativeBank.map((b) => (b.id === activeBank.id ? updater(b) : b))
    );
  };

  const resetElementToDefault = () => {
    const def = DEFAULT_NARRATIVE_BANK.find((b) => b.id === activeBank.id);
    if (!def) return;
    onChangeBank(
      narrativeBank.map((b) =>
        b.id === activeBank.id ? structuredClone(def) : b
      )
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Editor Bank Kalimat & Template Narasi
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Sesuaikan kalimat pembuka, kalimat penutup, dan kalimat masing-masing
            predikat (BB, MB, BSH, BSB). Gunakan{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono-tabular text-sky-800">
              [Nama]
            </code>{' '}
            agar otomatis diganti nama panggilan anak.
          </p>
        </div>
        <button
          type="button"
          onClick={resetElementToDefault}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Elemen {activeBank.code} ke Bawaan
        </button>
      </div>

      {/* Element Switcher */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        {narrativeBank.map((el) => (
          <button
            key={el.id}
            type="button"
            onClick={() => setSelectedEl(el.id)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedEl === el.id
                ? 'bg-sky-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {el.code}. {el.title} ({el.indicators.length} Indikator)
          </button>
        ))}
      </div>

      {/* Opening & Closing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <label className="text-xs font-semibold text-slate-800 block">
            Kalimat Pembuka Otomatis
          </label>
          <textarea
            rows={3}
            value={activeBank.openingTemplate}
            onChange={(e) =>
              updateActiveBank((prev) => ({
                ...prev,
                openingTemplate: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 leading-relaxed focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <label className="text-xs font-semibold text-slate-800 block">
            Kalimat Penutup Otomatis
          </label>
          <textarea
            rows={3}
            value={activeBank.closingTemplate}
            onChange={(e) =>
              updateActiveBank((prev) => ({
                ...prev,
                closingTemplate: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 leading-relaxed focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </div>
      </div>

      {/* Indicators */}
      <div className="space-y-4">
        {activeBank.indicators.map((ind) => (
          <div
            key={ind.id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
          >
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              {ind.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREDICATES.map((pred) => (
                <div key={pred} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {pred} — {PREDICATE_LABELS[pred].full}
                  </label>
                  <textarea
                    rows={3}
                    value={ind.texts[pred]}
                    onChange={(e) =>
                      updateActiveBank((prev) => ({
                        ...prev,
                        indicators: prev.indicators.map((item) =>
                          item.id === ind.id
                            ? {
                                ...item,
                                texts: {
                                  ...item.texts,
                                  [pred]: e.target.value,
                                },
                              }
                            : item
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 leading-relaxed focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
