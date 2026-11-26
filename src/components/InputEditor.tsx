import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Cloud,
  HeartHandshake,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  Wand2,
} from 'lucide-react';
import { PREDICATE_LABELS } from '../data/defaultData';
import type {
  AssessmentState,
  DdtkChecklist,
  ElementBank,
  ElementKey,
  PoseKey,
  PosePhotoItem,
  Predicate,
  SchoolSettings,
  StudentData,
} from '../types/rapor';
import { safeFetchJson } from '../utils/apiClient';
import {
  compressImageFile,
  extractImageFileFromClipboardData,
  generateElementNarrative,
  getCpPredicate,
  readImageBlobFromClipboard,
} from '../utils/narrativeGenerator';
import { SchoolLogo } from './DefaultSchoolLogo';
import { GoogleDrivePhotoModal } from './GoogleDrivePhotoModal';

export type InputSectionId =
  | 'lembaga'
  | 'siswa'
  | 'agama'
  | 'jatiDiri'
  | 'literasi'
  | 'lainnya';

interface InputEditorProps {
  school: SchoolSettings;
  onChangeSchool: (next: SchoolSettings) => void;
  student: StudentData;
  onChangeStudent: (next: StudentData) => void;
  assessment: AssessmentState;
  onChangeAssessment: (next: AssessmentState) => void;
  narrativeBank: ElementBank[];
  activeSection: InputSectionId;
  onChangeSection: (section: InputSectionId) => void;
}

interface DriveTarget {
  onSelect: (dataUrl: string) => void;
  compressOptions: {
    maxWidth?: number;
    maxHeight?: number;
    preservePng?: boolean;
    quality?: number;
  };
}

const PREDICATES: Predicate[] = ['BB', 'MB', 'BSH', 'BSB'];

const PREDICATE_ACTIVE_STYLE: Record<Predicate, string> = {
  BB: 'bg-rose-700 text-white border-rose-700',
  MB: 'bg-amber-600 text-white border-amber-600',
  BSH: 'bg-sky-700 text-white border-sky-700',
  BSB: 'bg-emerald-700 text-white border-emerald-700',
};

const SECTION_TABS: {
  id: InputSectionId;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'lembaga', label: '1. Lembaga & TTD', icon: Building2 },
  { id: 'siswa', label: '2. Data Diri Anak', icon: User },
  { id: 'agama', label: '3. Nilai Agama', icon: HeartHandshake },
  { id: 'jatiDiri', label: '4. Jati Diri', icon: Users },
  { id: 'literasi', label: '5. Literasi & STEAM', icon: BookOpen },
  { id: 'lainnya', label: '6. Ekskul, DDTK AI & Refleksi', icon: Sparkles },
];

const FieldLabel: React.FC<{ label: string; hint?: string }> = ({
  label,
  hint,
}) => (
  <div className="mb-1.5 flex items-baseline justify-between gap-2">
    <label className="text-xs font-semibold text-slate-700">{label}</label>
    {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
  </div>
);

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 transition-colors';

const textareaClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 transition-colors leading-relaxed';

export const InputEditor: React.FC<InputEditorProps> = ({
  school,
  onChangeSchool,
  student,
  onChangeStudent,
  assessment,
  onChangeAssessment,
  narrativeBank,
  activeSection,
  onChangeSection,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expandedCpElement, setExpandedCpElement] = useState<ElementKey | null>(
    null
  );
  const [extraSlotCounts, setExtraSlotCounts] = useState<Record<PoseKey, number>>({
    agama: 3,
    jatiDiri: 3,
    literasi: 3,
    ekskul: 3,
    kokurikuler: 3,
  });
  const [ddtkLoading, setDdtkLoading] = useState(false);
  const [ddtkError, setDdtkError] = useState<string | null>(null);
  const [ekskulLoading, setEkskulLoading] = useState(false);
  const [ekskulError, setEkskulError] = useState<string | null>(null);
  const [kokurikulerLoading, setKokurikulerLoading] = useState(false);
  const [kokurikulerError, setKokurikulerError] = useState<string | null>(null);
  const [refleksiLoading, setRefleksiLoading] = useState(false);
  const [refleksiError, setRefleksiError] = useState<string | null>(null);
  const [driveTarget, setDriveTarget] = useState<DriveTarget | null>(null);

  const updateSchool = (patch: Partial<SchoolSettings>) =>
    onChangeSchool({ ...school, ...patch });

  const updateStudent = (patch: Partial<StudentData>) =>
    onChangeStudent({ ...student, ...patch });

  const updateDdtkCheck = (patch: Partial<DdtkChecklist>) =>
    onChangeAssessment({
      ...assessment,
      ddtkCheck: { ...assessment.ddtkCheck, ...patch },
    });

  const handleImageBlob = async (
    blob: Blob | undefined,
    onSuccess: (dataUrl: string) => void,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      preservePng?: boolean;
      quality?: number;
    } = {}
  ) => {
    if (!blob) return;
    setUploadError(null);
    try {
      const compressed = await compressImageFile(blob, options);
      onSuccess(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal memproses gambar.'
      );
    }
  };

  const handlePasteButtonClick = async (
    onSuccess: (dataUrl: string) => void,
    options: DriveTarget['compressOptions']
  ) => {
    setUploadError(null);
    try {
      const blob = await readImageBlobFromClipboard();
      await handleImageBlob(blob, onSuccess, options);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal menempel gambar dari clipboard.'
      );
    }
  };

  const handleSlotPasteEvent = async (
    e: React.ClipboardEvent,
    onSuccess: (dataUrl: string) => void,
    options: DriveTarget['compressOptions']
  ) => {
    const file = extractImageFileFromClipboardData(e.clipboardData);
    if (file) {
      e.preventDefault();
      await handleImageBlob(file, onSuccess, options);
    }
  };

  const setIndicatorPredicate = (indicatorId: string, pred: Predicate) => {
    onChangeAssessment({
      ...assessment,
      indicatorPredicates: {
        ...assessment.indicatorPredicates,
        [indicatorId]: pred,
      },
    });
  };

  const setCustomNarrative = (elKey: ElementKey, value: string) => {
    onChangeAssessment({
      ...assessment,
      customNarratives: {
        ...assessment.customNarratives,
        [elKey]: value,
      },
    });
  };

  const clearCustomNarrative = (elKey: ElementKey) => {
    const next = { ...assessment.customNarratives };
    delete next[elKey];
    onChangeAssessment({
      ...assessment,
      customNarratives: next,
    });
  };

  const upsertPoseSlot = (
    poseKey: PoseKey,
    slotIndex: number,
    patch: Partial<PosePhotoItem>
  ) => {
    const currentList = [...(assessment.posePhotos[poseKey] || [])];
    while (currentList.length <= slotIndex) {
      currentList.push({
        id: `${poseKey}-${Date.now()}-${currentList.length}`,
        dataUrl: '',
        caption: '',
      });
    }
    currentList[slotIndex] = {
      ...currentList[slotIndex],
      ...patch,
    };
    onChangeAssessment({
      ...assessment,
      posePhotos: {
        ...assessment.posePhotos,
        [poseKey]: currentList,
      },
    });
  };

  const removePoseSlot = (poseKey: PoseKey, slotIndex: number) => {
    const currentList = [...(assessment.posePhotos[poseKey] || [])];
    if (slotIndex < currentList.length) {
      currentList[slotIndex] = {
        ...currentList[slotIndex],
        dataUrl: '',
        caption: '',
      };
    }
    while (
      currentList.length > 0 &&
      !currentList[currentList.length - 1].dataUrl &&
      !currentList[currentList.length - 1].caption
    ) {
      currentList.pop();
    }
    onChangeAssessment({
      ...assessment,
      posePhotos: {
        ...assessment.posePhotos,
        [poseKey]: currentList,
      },
    });
  };

  const setCpOverride = (cpId: string, pred: Predicate | undefined) => {
    const next = { ...assessment.cpOverrides };
    if (pred) {
      next[cpId] = pred;
    } else {
      delete next[cpId];
    }
    onChangeAssessment({
      ...assessment,
      cpOverrides: next,
    });
  };

  const handleGenerateDdtkAi = async () => {
    setDdtkLoading(true);
    setDdtkError(null);
    try {
      const data = await safeFetchJson<{ narrative?: string }>(
        '/api/ddtk/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaLengkap: student.namaLengkap,
            namaPanggilan: student.namaPanggilan,
            jenisKelamin: student.jenisKelamin,
            umur: student.umur,
            tinggiBadan: student.tinggiBadan,
            beratBadan: student.beratBadan,
            ...assessment.ddtkCheck,
          }),
        }
      );
      if (typeof data.narrative === 'string' && data.narrative.trim()) {
        onChangeAssessment({
          ...assessment,
          deteksiDini: data.narrative.trim(),
        });
      } else {
        throw new Error('Server tidak mengembalikan teks narasi DDTK.');
      }
    } catch (err) {
      setDdtkError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi layanan AI.'
      );
    } finally {
      setDdtkLoading(false);
    }
  };

  const nicknameForNarrative =
    student.namaPanggilan.trim() ||
    student.namaLengkap.trim().split(' ')[0] ||
    '...';

  const getEffectiveElementNarrative = (elKey: ElementKey): string => {
    const manual = assessment.customNarratives[elKey];
    if (typeof manual === 'string' && manual.trim().length > 0) {
      return manual.trim();
    }
    const bank = narrativeBank.find((b) => b.id === elKey);
    if (!bank) return '';
    return generateElementNarrative(
      bank,
      assessment.indicatorPredicates,
      nicknameForNarrative
    );
  };

  const handleGenerateActivityAi = async (category: 'ekskul' | 'kokurikuler') => {
    const isKokurikuler = category === 'kokurikuler';
    const setLoading = isKokurikuler ? setKokurikulerLoading : setEkskulLoading;
    const setErr = isKokurikuler ? setKokurikulerError : setEkskulError;

    const uploadedPhotos = (assessment.posePhotos[category] || []).filter(
      (p) => Boolean(p?.dataUrl)
    );

    if (uploadedPhotos.length === 0) {
      setErr(
        `Unggah minimal 1 foto pose kegiatan ${
          isKokurikuler ? 'kokurikuler' : 'ekstrakurikuler'
        } terlebih dahulu agar AI dapat menganalisis kegiatan dari foto.`
      );
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const data = await safeFetchJson<{ narrative?: string }>(
        '/api/activity/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            namaLengkap: student.namaLengkap,
            namaPanggilan: student.namaPanggilan,
            kelas: student.kelas,
            semester: school.semester,
            photos: uploadedPhotos.map((p) => ({
              dataUrl: p.dataUrl,
              caption: p.caption,
            })),
          }),
        }
      );
      if (typeof data.narrative === 'string' && data.narrative.trim()) {
        onChangeAssessment({
          ...assessment,
          ...(isKokurikuler
            ? { kokurikulerText: data.narrative.trim() }
            : { ekskulText: data.narrative.trim() }),
        });
      } else {
        throw new Error('Server tidak mengembalikan narasi dari analisis foto.');
      }
    } catch (err) {
      setErr(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menganalisis foto dengan AI.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRefleksiGuruAi = async () => {
    setRefleksiLoading(true);
    setRefleksiError(null);
    try {
      const elemenAgama = getEffectiveElementNarrative('agama');
      const elemenJatiDiri = getEffectiveElementNarrative('jatiDiri');
      const elemenLiterasi = getEffectiveElementNarrative('literasi');

      const data = await safeFetchJson<{ narrative?: string }>(
        '/api/refleksi-guru/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaLengkap: student.namaLengkap,
            namaPanggilan: student.namaPanggilan,
            kelas: student.kelas,
            semester: school.semester,
            elemenAgama,
            elemenJatiDiri,
            elemenLiterasi,
          }),
        }
      );
      if (typeof data.narrative === 'string' && data.narrative.trim()) {
        onChangeAssessment({
          ...assessment,
          refleksiGuru: data.narrative.trim(),
        });
      } else {
        throw new Error('Server tidak mengembalikan catatan refleksi guru.');
      }
    } catch (err) {
      setRefleksiError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghubungi layanan AI.'
      );
    } finally {
      setRefleksiLoading(false);
    }
  };

  const renderPhotoSourceButtons = (
    onSelect: (dataUrl: string) => void,
    compressOptions: DriveTarget['compressOptions'],
    compact = false
  ) => {
    const btnCls = compact
      ? 'inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap'
      : 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap';

    return (
      <div className="flex flex-wrap gap-1.5">
        <label className={btnCls}>
          <Upload className="w-3.5 h-3.5 text-sky-700" />
          <span>File Lokal</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              handleImageBlob(file, onSelect, compressOptions);
            }}
          />
        </label>

        <button
          type="button"
          onClick={() => handlePasteButtonClick(onSelect, compressOptions)}
          title="Tempel gambar yang sudah di-Copy (atau klik kotak foto lalu tekan Ctrl+V)"
          className={btnCls}
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-emerald-700" />
          <span>Tempel (Paste)</span>
        </button>

        <button
          type="button"
          onClick={() => setDriveTarget({ onSelect, compressOptions })}
          className={btnCls}
        >
          <Cloud className="w-3.5 h-3.5 text-amber-600" />
          <span>Google Drive</span>
        </button>
      </div>
    );
  };

  const renderPoseUploader = (poseKey: PoseKey, label: string) => {
    const list = assessment.posePhotos[poseKey] || [];
    const totalSlots = Math.max(3, list.length, extraSlotCounts[poseKey] || 3);
    const poseCompressOpts = { maxWidth: 720, maxHeight: 540, quality: 0.78 };

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Foto Pose Kegiatan — {label}
            </h4>
            <p className="text-xs text-slate-500">
              Unggah minimal 3 foto kegiatan lewat File Lokal, Tempel (Ctrl+V /
              Paste), atau Google Drive.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setExtraSlotCounts((prev) => ({
                ...prev,
                [poseKey]: Math.max(3, totalSlots) + 1,
              }))
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Slot Foto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: totalSlots }, (_, idx) => {
            const item = list[idx];
            const hasPhoto = Boolean(item?.dataUrl);
            const handleSetSlotPhoto = (url: string) =>
              upsertPoseSlot(poseKey, idx, { dataUrl: url });

            return (
              <div
                key={`${poseKey}-slot-${idx}`}
                tabIndex={0}
                onPaste={(e) =>
                  handleSlotPasteEvent(e, handleSetSlotPhoto, poseCompressOpts)
                }
                className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-between gap-2.5 focus:outline-none focus:ring-2 focus:ring-sky-600/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Foto Kegiatan {idx + 1}
                  </span>
                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={() => removePoseSlot(poseKey, idx)}
                      title="Hapus foto ini"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 hover:text-rose-900"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  )}
                </div>

                <label className="cursor-pointer group flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-2 h-32 hover:border-sky-500 transition-colors overflow-hidden">
                  {hasPhoto ? (
                    <img
                      src={item.dataUrl}
                      alt={`Foto ${label} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="max-h-28 w-full object-contain rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center text-slate-500 group-hover:text-sky-700">
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">
                        Pilih atau Ctrl+V di sini
                      </span>
                      <span className="text-[10px] text-slate-400">
                        JPG / PNG / Clipboard
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      handleImageBlob(
                        file,
                        handleSetSlotPhoto,
                        poseCompressOpts
                      );
                    }}
                  />
                </label>

                {renderPhotoSourceButtons(
                  handleSetSlotPhoto,
                  poseCompressOpts,
                  true
                )}

                <input
                  type="text"
                  value={item?.caption || ''}
                  onChange={(e) =>
                    upsertPoseSlot(poseKey, idx, { caption: e.target.value })
                  }
                  placeholder={`Keterangan foto ${idx + 1} (opsional)`}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderElementAssessment = (elKey: ElementKey) => {
    const bank = narrativeBank.find((b) => b.id === elKey);
    if (!bank) return null;

    const autoNarrative = generateElementNarrative(
      bank,
      assessment.indicatorPredicates,
      nicknameForNarrative
    );
    const manualValue = assessment.customNarratives[elKey];
    const hasManualOverride =
      typeof manualValue === 'string' && manualValue.trim().length > 0;
    const displayedNarrative = hasManualOverride ? manualValue : autoNarrative;
    const isCpExpanded = expandedCpElement === elKey;

    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-base font-bold text-slate-900">
            {bank.code}. {bank.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Pilih predikat (<span className="font-semibold">BB</span>,{' '}
            <span className="font-semibold">MB</span>,{' '}
            <span className="font-semibold">BSH</span>, atau{' '}
            <span className="font-semibold">BSB</span>) untuk setiap indikator.
            Narasi rapor akan otomatis tersusun dengan nama panggilan{' '}
            <span className="font-semibold text-sky-800">
              Ananda {nicknameForNarrative}
            </span>
            .
          </p>
        </div>

        <div className="space-y-4">
          {bank.indicators.map((ind, idx) => {
            const selectedPred: Predicate =
              assessment.indicatorPredicates[ind.id] || 'BSH';
            const previewSentence = ind.texts[selectedPred].replace(
              /\[Nama\]/gi,
              nicknameForNarrative
            );

            return (
              <div
                key={ind.id}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">
                    <span className="font-mono-tabular text-slate-500 mr-1.5">
                      {idx + 1}.
                    </span>
                    {ind.label.replace(/^Indikator\s+\d+\s+—\s+/i, '')}
                  </div>

                  <div
                    className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 gap-1 shrink-0"
                    role="group"
                    aria-label={ind.label}
                  >
                    {PREDICATES.map((pred) => {
                      const active = selectedPred === pred;
                      return (
                        <button
                          key={pred}
                          type="button"
                          onClick={() => setIndicatorPredicate(ind.id, pred)}
                          title={PREDICATE_LABELS[pred].full}
                          className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                            active
                              ? PREDICATE_ACTIVE_STYLE[pred]
                              : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          {pred}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
                  <span className="font-semibold text-slate-800 mr-1.5">
                    {selectedPred} ({PREDICATE_LABELS[selectedPred].full}):
                  </span>
                  {previewSentence}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Hasil Gabungan Paragraf Narasi Rapor
              </h4>
              <p className="text-xs text-slate-500">
                {hasManualOverride
                  ? 'Mode edit manual aktif — perubahan pilihan indikator tidak menimpa teks ini sampai Anda menekan Sinkronkan Otomatis.'
                  : 'Otomatis tersusun dari kalimat pembuka + seluruh indikator + kalimat penutup.'}
              </p>
            </div>
            {hasManualOverride && (
              <button
                type="button"
                onClick={() => clearCustomNarrative(elKey)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Sinkronkan Otomatis
              </button>
            )}
          </div>

          <textarea
            rows={7}
            value={displayedNarrative}
            onChange={(e) => setCustomNarrative(elKey, e.target.value)}
            className={textareaClass}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedCpElement(isCpExpanded ? null : elKey)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>
              Penyesuaian Manual Centang Tabel CP Resmi ({bank.cpList.length} Butir CP)
            </span>
            {isCpExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {isCpExpanded && (
            <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Secara bawaan, tanda centang (✓) pada tabel Capaian Pembelajaran
                otomatis dihitung dari indikator yang Anda pilih. Anda dapat
                menyesuaikannya secara manual di bawah ini jika perlu.
              </p>
              {bank.cpList.map((cp, i) => {
                const effective = getCpPredicate(
                  cp,
                  assessment.indicatorPredicates,
                  assessment.cpOverrides
                );
                const isOverridden = Boolean(assessment.cpOverrides[cp.id]);
                return (
                  <div
                    key={cp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold mr-1">{i + 1}.</span>
                      {cp.text}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {PREDICATES.map((pred) => (
                        <button
                          key={pred}
                          type="button"
                          onClick={() => setCpOverride(cp.id, pred)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            effective === pred
                              ? PREDICATE_ACTIVE_STYLE[pred]
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pred}
                        </button>
                      ))}
                      {isOverridden && (
                        <button
                          type="button"
                          onClick={() => setCpOverride(cp.id, undefined)}
                          title="Kembalikan ke otomatis"
                          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {renderPoseUploader(elKey, bank.title)}
      </div>
    );
  };

  const logoCompressOpts = {
    maxWidth: 500,
    maxHeight: 500,
    preservePng: true,
  };

  const studentPhotoCompressOpts = {
    maxWidth: 600,
    maxHeight: 800,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        {SECTION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSection(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {uploadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800">
          {uploadError}
        </div>
      )}

      {activeSection === 'lembaga' && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Identitas Lembaga, Logo & Tanda Tangan Rapor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh perubahan langsung diperbarui pada halaman Sampul, Data
              Diri, dan Kop Surat Rapor serta berlaku untuk seluruh murid.
            </p>
          </div>

          <div
            tabIndex={0}
            onPaste={(e) =>
              handleSlotPasteEvent(
                e,
                (url) => updateSchool({ logoDataUrl: url }),
                logoCompressOpts
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-center gap-5 focus:outline-none focus:ring-2 focus:ring-sky-600/30"
          >
            <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 shrink-0">
              <SchoolLogo
                logoDataUrl={school.logoDataUrl}
                schoolName={school.namaSekolah}
                className="w-20 h-20"
              />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-slate-900">
                Logo Sekolah
              </h4>
              <p className="text-xs text-slate-500">
                Secara bawaan menggunakan logo segilima biru TK SINAR DUNIA -
                NGAJUM. Unggah dari File Lokal, Tempel (Ctrl+V / Paste), atau
                Google Drive.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-1">
                {renderPhotoSourceButtons(
                  (url) => updateSchool({ logoDataUrl: url }),
                  logoCompressOpts
                )}
                {school.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => updateSchool({ logoDataUrl: null })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Kembalikan Bawaan
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel label="Nama Sekolah (Sampul & TTD)" />
              <input
                type="text"
                value={school.namaSekolah}
                onChange={(e) => updateSchool({ namaSekolah: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Nama Yayasan (Kop Surat)" />
              <input
                type="text"
                value={school.namaYayasan}
                onChange={(e) => updateSchool({ namaYayasan: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel label="Nama Lembaga Lengkap (Kop Surat)" />
              <input
                type="text"
                value={school.namaLembagaKop}
                onChange={(e) =>
                  updateSchool({ namaLembagaKop: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="NPSN" />
              <input
                type="text"
                value={school.npsn}
                onChange={(e) => updateSchool({ npsn: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="NSS" />
              <input
                type="text"
                value={school.nss}
                onChange={(e) => updateSchool({ nss: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="CP / Telepon (Sampul)" />
              <input
                type="text"
                value={school.cpCover}
                onChange={(e) => updateSchool({ cpCover: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="CP / Telepon (Kop Surat)" />
              <input
                type="text"
                value={school.cpKop}
                onChange={(e) => updateSchool({ cpKop: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="Email Lembaga" />
              <input
                type="email"
                value={school.email}
                onChange={(e) => updateSchool({ email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Tahun Ajaran" />
              <input
                type="text"
                value={school.tahunAjaran}
                onChange={(e) => updateSchool({ tahunAjaran: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="Semester" />
              <input
                type="text"
                value={school.semester}
                onChange={(e) => updateSchool({ semester: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Kota & Tanggal Rapor" />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={school.kotaRapor}
                  onChange={(e) => updateSchool({ kotaRapor: e.target.value })}
                  placeholder="Malang"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={school.tanggalRapor}
                  onChange={(e) =>
                    updateSchool({ tanggalRapor: e.target.value })
                  }
                  placeholder="19 Desember 2026"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <FieldLabel label="Alamat Lengkap (Sampul)" />
              <input
                type="text"
                value={school.alamatCover}
                onChange={(e) => updateSchool({ alamatCover: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel label="Alamat Lengkap (Kop Surat)" />
              <input
                type="text"
                value={school.alamatKop}
                onChange={(e) => updateSchool({ alamatKop: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Tanda Tangan */}
            <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Penandatangan Rapor
              </h4>
            </div>
            <div>
              <FieldLabel label="Nama Koordinator Kokurikuler" />
              <input
                type="text"
                value={school.namaKoordinatorKokurikuler || ''}
                onChange={(e) =>
                  updateSchool({ namaKoordinatorKokurikuler: e.target.value })
                }
                placeholder="Nama Koordinator Kokurikuler"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="NIP Koordinator Kokurikuler" />
              <input
                type="text"
                value={school.nipKoordinatorKokurikuler || ''}
                onChange={(e) =>
                  updateSchool({ nipKoordinatorKokurikuler: e.target.value })
                }
                placeholder="-"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Nama Guru Kelas" />
              <input
                type="text"
                value={school.namaGuru}
                onChange={(e) => updateSchool({ namaGuru: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="NIP Guru Kelas" />
              <input
                type="text"
                value={school.nipGuru}
                onChange={(e) => updateSchool({ nipGuru: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Nama Kepala Sekolah" />
              <input
                type="text"
                value={school.namaKepalaSekolah}
                onChange={(e) =>
                  updateSchool({ namaKepalaSekolah: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="NIP Kepala Sekolah" />
              <input
                type="text"
                value={school.nipKepalaSekolah}
                onChange={(e) =>
                  updateSchool({ nipKepalaSekolah: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === 'siswa' && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Identitas & Data Diri Anak
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nama panggilan otomatis digunakan dalam narasi capaian
              pembelajaran (menggantikan kata [Nama]).
            </p>
          </div>

          <div
            tabIndex={0}
            onPaste={(e) =>
              handleSlotPasteEvent(
                e,
                (url) => updateStudent({ fotoAnakDataUrl: url }),
                studentPhotoCompressOpts
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-center gap-5 focus:outline-none focus:ring-2 focus:ring-sky-600/30"
          >
            <div className="w-[90px] h-[120px] rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
              {student.fotoAnakDataUrl ? (
                <img
                  src={student.fotoAnakDataUrl}
                  alt="Pas foto anak"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-slate-400 text-center px-2">
                  Pas Foto 3x4
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-slate-900">
                Pas Foto Anak (3x4)
              </h4>
              <p className="text-xs text-slate-500">
                Ditampilkan pada Halaman 2 (Data Diri Anak). Masukkan foto lewat
                File Lokal, Tempel (Ctrl+V / Paste), atau Google Drive.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 pt-1">
                {renderPhotoSourceButtons(
                  (url) => updateStudent({ fotoAnakDataUrl: url }),
                  studentPhotoCompressOpts
                )}
                {student.fotoAnakDataUrl && (
                  <button
                    type="button"
                    onClick={() => updateStudent({ fotoAnakDataUrl: null })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel label="1a. Nama Lengkap Anak" />
              <input
                type="text"
                value={student.namaLengkap}
                onChange={(e) => updateStudent({ namaLengkap: e.target.value })}
                placeholder="Contoh: Aisyah Putri Ramadhani"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel
                label="1b. Nama Panggilan"
                hint="Dipakai di narasi rapor"
              />
              <input
                type="text"
                value={student.namaPanggilan}
                onChange={(e) =>
                  updateStudent({ namaPanggilan: e.target.value })
                }
                placeholder="Contoh: Aisyah"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="2. NIK" />
              <input
                type="text"
                value={student.nik}
                onChange={(e) => updateStudent({ nik: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="3. NISN / NIPD" />
              <input
                type="text"
                value={student.nisnNipd}
                onChange={(e) => updateStudent({ nisnNipd: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div>
              <FieldLabel label="4. Jenis Kelamin" />
              <select
                value={student.jenisKelamin}
                onChange={(e) =>
                  updateStudent({
                    jenisKelamin: e.target.value as StudentData['jenisKelamin'],
                  })
                }
                className={inputClass}
              >
                <option value="Perempuan">Perempuan</option>
                <option value="Laki-laki">Laki-laki</option>
              </select>
            </div>
            <div>
              <FieldLabel label="5. Tempat & Tanggal Lahir" />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={student.tempatLahir}
                  onChange={(e) =>
                    updateStudent({ tempatLahir: e.target.value })
                  }
                  placeholder="Malang"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={student.tanggalLahir}
                  onChange={(e) =>
                    updateStudent({ tanggalLahir: e.target.value })
                  }
                  placeholder="15 Juni 2020"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <FieldLabel label="6. Agama" />
              <input
                type="text"
                value={student.agama}
                onChange={(e) => updateStudent({ agama: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="7. Anak ke-" />
              <input
                type="text"
                value={student.anakKe}
                onChange={(e) => updateStudent({ anakKe: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel label="Umur Anak (Halaman Capaian)" />
              <input
                type="text"
                value={student.umur}
                onChange={(e) => updateStudent({ umur: e.target.value })}
                placeholder="Contoh: 6 Tahun 5 Bulan"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Kelas / Kelompok" />
              <input
                type="text"
                value={student.kelas}
                onChange={(e) => updateStudent({ kelas: e.target.value })}
                placeholder="B"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Tinggi Badan (TB)" />
              <input
                type="text"
                value={student.tinggiBadan}
                onChange={(e) => updateStudent({ tinggiBadan: e.target.value })}
                placeholder="112 cm"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Berat Badan (BB)" />
              <input
                type="text"
                value={student.beratBadan}
                onChange={(e) => updateStudent({ beratBadan: e.target.value })}
                placeholder="19 kg"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                8 & 9. Data Orang Tua / Wali
              </h4>
            </div>
            <div>
              <FieldLabel label="Nama Ayah" />
              <input
                type="text"
                value={student.namaAyah}
                onChange={(e) => updateStudent({ namaAyah: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Nama Ibu" />
              <input
                type="text"
                value={student.namaIbu}
                onChange={(e) => updateStudent({ namaIbu: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Nomor HP Orang Tua / Wali" />
              <input
                type="text"
                value={student.noHpOrtu}
                onChange={(e) => updateStudent({ noHpOrtu: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel label="Pekerjaan Ayah" />
                <input
                  type="text"
                  value={student.pekerjaanAyah}
                  onChange={(e) =>
                    updateStudent({ pekerjaanAyah: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel label="Pekerjaan Ibu" />
                <input
                  type="text"
                  value={student.pekerjaanIbu}
                  onChange={(e) =>
                    updateStudent({ pekerjaanIbu: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                10. Alamat Orang Tua / Wali
              </h4>
            </div>
            <div className="md:col-span-2">
              <FieldLabel label="Nama Jalan / Dusun / Desa" />
              <input
                type="text"
                value={student.alamatJalan}
                onChange={(e) => updateStudent({ alamatJalan: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Kecamatan" />
              <input
                type="text"
                value={student.kecamatan}
                onChange={(e) => updateStudent({ kecamatan: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Kabupaten / Kota" />
              <input
                type="text"
                value={student.kabupatenKota}
                onChange={(e) =>
                  updateStudent({ kabupatenKota: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Provinsi" />
              <input
                type="text"
                value={student.provinsi}
                onChange={(e) => updateStudent({ provinsi: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel label="Kode Pos" />
              <input
                type="text"
                value={student.kodePos}
                onChange={(e) => updateStudent({ kodePos: e.target.value })}
                className={`${inputClass} font-mono-tabular`}
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === 'agama' && renderElementAssessment('agama')}
      {activeSection === 'jatiDiri' && renderElementAssessment('jatiDiri')}
      {activeSection === 'literasi' && renderElementAssessment('literasi')}

      {activeSection === 'lainnya' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kegiatan Ekstrakurikuler
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah foto kegiatan di bawah lalu klik AI untuk menganalisis
                  foto dan menyusun narasi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateActivityAi('ekskul')}
                disabled={ekskulLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {ekskulLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menganalisis Foto...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Buat Narasi dari Foto (AI)
                  </>
                )}
              </button>
            </div>
            {ekskulError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800">
                {ekskulError}
              </div>
            )}
            <div>
              <FieldLabel
                label="Narasi Kegiatan Ekstrakurikuler"
                hint={`${(assessment.posePhotos.ekskul || []).filter((p) => Boolean(p?.dataUrl)).length} foto siap dianalisis`}
              />
              <textarea
                rows={4}
                value={assessment.ekskulText}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    ekskulText: e.target.value,
                  })
                }
                placeholder="Unggah foto kegiatan ekstrakurikuler lalu klik 'Buat Narasi dari Foto (AI)' atau tulis langsung..."
                className={textareaClass}
              />
            </div>
            {renderPoseUploader('ekskul', 'KEGIATAN EKSTRAKURIKULER')}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kegiatan Kokurikuler
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah foto kegiatan kokurikuler (P5) lalu klik AI untuk
                  menganalisis foto dan menyusun narasi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateActivityAi('kokurikuler')}
                disabled={kokurikulerLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {kokurikulerLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menganalisis Foto...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Buat Narasi dari Foto (AI)
                  </>
                )}
              </button>
            </div>
            {kokurikulerError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800">
                {kokurikulerError}
              </div>
            )}
            <div>
              <FieldLabel
                label="Narasi Kegiatan Kokurikuler (P5)"
                hint={`${(assessment.posePhotos.kokurikuler || []).filter((p) => Boolean(p?.dataUrl)).length} foto siap dianalisis`}
              />
              <textarea
                rows={4}
                value={assessment.kokurikulerText}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    kokurikulerText: e.target.value,
                  })
                }
                placeholder="Unggah foto kegiatan kokurikuler lalu klik 'Buat Narasi dari Foto (AI)' atau tulis langsung..."
                className={textareaClass}
              />
            </div>
            {renderPoseUploader('kokurikuler', 'KEGIATAN KOKURIKULER')}
          </div>

          {/* Deteksi Dini Tumbuh Kembang Anak + TB/BB + AI Generator */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Deteksi Dini Tumbuh Kembang Anak (DDTK)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi TB, BB, dan hasil pemeriksaan DDTK lalu klik tombol AI
                  untuk menyusun narasi otomatis yang siap dicetak.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateDdtkAi}
                disabled={ddtkLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {ddtkLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyusun Narasi...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Buat Narasi DDTK Otomatis (AI)
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <FieldLabel label="Tinggi Badan (TB)" hint="Sinkron Data Diri" />
                <input
                  type="text"
                  value={student.tinggiBadan}
                  onChange={(e) =>
                    updateStudent({ tinggiBadan: e.target.value })
                  }
                  placeholder="Contoh: 112 cm"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel label="Berat Badan (BB)" hint="Sinkron Data Diri" />
                <input
                  type="text"
                  value={student.beratBadan}
                  onChange={(e) =>
                    updateStudent({ beratBadan: e.target.value })
                  }
                  placeholder="Contoh: 19 kg"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel label="Lingkar Kepala" hint="Opsional" />
                <input
                  type="text"
                  value={assessment.ddtkCheck.lingkarKepala}
                  onChange={(e) =>
                    updateDdtkCheck({ lingkarKepala: e.target.value })
                  }
                  placeholder="Contoh: 50 cm"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel label="Daya Lihat (Penglihatan)" />
                <select
                  value={assessment.ddtkCheck.penglihatan}
                  onChange={(e) =>
                    updateDdtkCheck({ penglihatan: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="Normal (dapat mengenali bentuk, warna, dan objek dengan jelas)">
                    Normal & Jelas
                  </option>
                  <option value="Normal dengan bantuan kacamata">
                    Normal dengan Kacamata
                  </option>
                  <option value="Perlu pemantauan / pemeriksaan lanjutan daya lihat">
                    Perlu Pemantauan Lanjutan
                  </option>
                </select>
              </div>
              <div>
                <FieldLabel label="Daya Dengar (Pendengaran)" />
                <select
                  value={assessment.ddtkCheck.pendengaran}
                  onChange={(e) =>
                    updateDdtkCheck({ pendengaran: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="Normal (merespons panggilan dan instruksi suara dengan baik)">
                    Normal & Responsif
                  </option>
                  <option value="Perlu pengulangan instruksi suara pelan">
                    Perlu Pengulangan Instruksi
                  </option>
                  <option value="Perlu pemantauan / pemeriksaan lanjutan daya dengar">
                    Perlu Pemantauan Lanjutan
                  </option>
                </select>
              </div>
              <div>
                <FieldLabel label="Motorik Kasar & Halus" />
                <select
                  value={assessment.ddtkCheck.motorik}
                  onChange={(e) => updateDdtkCheck({ motorik: e.target.value })}
                  className={inputClass}
                >
                  <option value="Sesuai usia (lincah berlari, melompat, dan memegang alat tulis/gunting)">
                    Sesuai Tahapan Usia
                  </option>
                  <option value="Berkembang sangat baik (koordinasi tubuh dan jemari sangat terampil)">
                    Berkembang Sangat Baik
                  </option>
                  <option value="Perlu stimulasi tambahan pada koordinasi gerak dan motorik halus">
                    Perlu Stimulasi Tambahan
                  </option>
                </select>
              </div>
              <div>
                <FieldLabel label="Bahasa & Sosial-Emosional" />
                <select
                  value={assessment.ddtkCheck.bahasaSosial}
                  onChange={(e) =>
                    updateDdtkCheck({ bahasaSosial: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="Sesuai usia (komunikatif, mampu bercerita dan berinteraksi baik)">
                    Sesuai Tahapan Usia
                  </option>
                  <option value="Sangat aktif berbicara dan percaya diri dalam berinteraksi">
                    Sangat Komunikatif & Percaya Diri
                  </option>
                  <option value="Perlu stimulasi pengayaan kosakata dan keberanian berinteraksi">
                    Perlu Stimulasi Tambahan
                  </option>
                </select>
              </div>
              <div>
                <FieldLabel label="Catatan Tambahan Guru" hint="Opsional" />
                <input
                  type="text"
                  value={assessment.ddtkCheck.catatanTambahan}
                  onChange={(e) =>
                    updateDdtkCheck({ catatanTambahan: e.target.value })
                  }
                  placeholder="Misal: gigi bersih, nafsu makan baik"
                  className={inputClass}
                />
              </div>
            </div>

            {ddtkError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800">
                {ddtkError}
              </div>
            )}

            <div>
              <FieldLabel
                label="Narasi Deteksi Dini Tumbuh Kembang Anak (Tercetak di Rapor)"
                hint={`Usia ${student.umur || '-'} · TB ${student.tinggiBadan || '-'} · BB ${student.beratBadan || '-'}`}
              />
              <textarea
                rows={4}
                value={assessment.deteksiDini}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    deteksiDini: e.target.value,
                  })
                }
                placeholder="Klik 'Buat Narasi DDTK Otomatis (AI)' atau tulis langsung catatan tumbuh kembang anak..."
                className={textareaClass}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Refleksi Guru & Refleksi Orang Tua
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI dapat merangkum perkembangan 3 elemen capaian pembelajaran
                  beserta saran untuk orang tua dan anak.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateRefleksiGuruAi}
                disabled={refleksiLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {refleksiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Merangkum 3 Elemen...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Buat Refleksi Guru Otomatis (AI)
                  </>
                )}
              </button>
            </div>
            {refleksiError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800">
                {refleksiError}
              </div>
            )}
            <div>
              <FieldLabel
                label="Refleksi Guru"
                hint="Rangkuman 3 elemen CP + saran orang tua & anak"
              />
              <textarea
                rows={5}
                value={assessment.refleksiGuru}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    refleksiGuru: e.target.value,
                  })
                }
                placeholder="Klik 'Buat Refleksi Guru Otomatis (AI)' atau tulis langsung catatan refleksi guru..."
                className={textareaClass}
              />
            </div>
            <div>
              <FieldLabel
                label="Refleksi Orang Tua (Opsional)"
                hint="Kosongkan agar tercetak garis titik-titik untuk diisi orang tua"
              />
              <textarea
                rows={3}
                value={assessment.refleksiOrtu}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    refleksiOrtu: e.target.value,
                  })
                }
                placeholder="Biarkan kosong jika ingin mencetak garis titik-titik untuk ditulis tangan oleh orang tua..."
                className={textareaClass}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Informasi Kehadiran & Nama Orang Tua (Tanda Tangan)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <FieldLabel label="Sakit (Hari)" />
                <input
                  type="number"
                  min={0}
                  value={assessment.kehadiran.sakit}
                  onChange={(e) =>
                    onChangeAssessment({
                      ...assessment,
                      kehadiran: {
                        ...assessment.kehadiran,
                        sakit: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono-tabular`}
                />
              </div>
              <div>
                <FieldLabel label="Izin (Hari)" />
                <input
                  type="number"
                  min={0}
                  value={assessment.kehadiran.izin}
                  onChange={(e) =>
                    onChangeAssessment({
                      ...assessment,
                      kehadiran: {
                        ...assessment.kehadiran,
                        izin: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono-tabular`}
                />
              </div>
              <div>
                <FieldLabel label="Tanpa Keterangan (Hari)" />
                <input
                  type="number"
                  min={0}
                  value={assessment.kehadiran.tanpaKeterangan}
                  onChange={(e) =>
                    onChangeAssessment({
                      ...assessment,
                      kehadiran: {
                        ...assessment.kehadiran,
                        tanpaKeterangan: e.target.value,
                      },
                    })
                  }
                  className={`${inputClass} font-mono-tabular`}
                />
              </div>
            </div>
            <div>
              <FieldLabel
                label="Nama Orang Tua / Wali pada Kolom Tanda Tangan (Opsional)"
                hint="Kosongkan untuk garis titik-titik"
              />
              <input
                type="text"
                value={assessment.namaOrtuTtd}
                onChange={(e) =>
                  onChangeAssessment({
                    ...assessment,
                    namaOrtuTtd: e.target.value,
                  })
                }
                placeholder="Nama Ayah/Ibu/Wali"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Photo Picker Modal */}
      <GoogleDrivePhotoModal
        isOpen={Boolean(driveTarget)}
        onClose={() => setDriveTarget(null)}
        onSelectImageBlob={async (blob) => {
          if (!driveTarget) return;
          await handleImageBlob(
            blob,
            driveTarget.onSelect,
            driveTarget.compressOptions
          );
        }}
      />
    </div>
  );
};
