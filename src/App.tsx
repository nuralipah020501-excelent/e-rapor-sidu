import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  createDefaultSampleRecord,
  createEmptyStudentRecord,
  createStudentId,
  DEFAULT_NARRATIVE_BANK,
  DEFAULT_SCHOOL_SETTINGS,
  EMPTY_STUDENT,
  normalizeAssessmentState,
} from './data/defaultData';
import { InputEditor, type InputSectionId } from './components/InputEditor';
import { NarrativeBankEditor } from './components/NarrativeBankEditor';
import { RaporDocument } from './components/RaporDocument';
import type {
  AssessmentState,
  ElementBank,
  PaperSize,
  RaporBundle,
  SchoolSettings,
  StudentData,
  StudentRecord,
} from './types/rapor';
import { exportRaporToWord } from './utils/wordExporter';

type ViewMode = 'input' | 'preview' | 'split' | 'bank';

const STORAGE_KEY_V2 = 'erapor_tk_sinar_dunia_v2';
const STORAGE_KEY_V1 = 'erapor_tk_sinar_dunia_v1';

interface StoredStateV2 {
  school: SchoolSettings;
  students: StudentRecord[];
  activeStudentId: string;
  narrativeBank: ElementBank[];
  paperSize: PaperSize;
}

function loadInitialState(): StoredStateV2 {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<StoredStateV2>;
      const students = Array.isArray(parsed.students) && parsed.students.length > 0
        ? parsed.students.map((rec) => ({
            id: rec.id || createStudentId(),
            updatedAt: rec.updatedAt || new Date().toISOString(),
            student: { ...EMPTY_STUDENT, ...(rec.student || {}) },
            assessment: normalizeAssessmentState(rec.assessment),
          }))
        : [createDefaultSampleRecord()];

      const activeId =
        parsed.activeStudentId &&
        students.some((s) => s.id === parsed.activeStudentId)
          ? parsed.activeStudentId
          : students[0].id;

      return {
        school: { ...DEFAULT_SCHOOL_SETTINGS, ...(parsed.school || {}) },
        students,
        activeStudentId: activeId,
        narrativeBank:
          Array.isArray(parsed.narrativeBank) && parsed.narrativeBank.length === 3
            ? parsed.narrativeBank
            : structuredClone(DEFAULT_NARRATIVE_BANK),
        paperSize: parsed.paperSize === 'F4' ? 'F4' : 'A4',
      };
    }

    // Migrate v1 single-student storage seamlessly
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1) as {
        school?: Partial<SchoolSettings>;
        student?: Partial<StudentData>;
        assessment?: unknown;
        narrativeBank?: ElementBank[];
        paperSize?: PaperSize;
      };
      const migratedRecord: StudentRecord = {
        id: createStudentId(),
        updatedAt: new Date().toISOString(),
        student: { ...EMPTY_STUDENT, ...(parsedV1.student || {}) },
        assessment: normalizeAssessmentState(parsedV1.assessment),
      };
      return {
        school: { ...DEFAULT_SCHOOL_SETTINGS, ...(parsedV1.school || {}) },
        students: [migratedRecord],
        activeStudentId: migratedRecord.id,
        narrativeBank:
          Array.isArray(parsedV1.narrativeBank) &&
          parsedV1.narrativeBank.length === 3
            ? parsedV1.narrativeBank
            : structuredClone(DEFAULT_NARRATIVE_BANK),
        paperSize: parsedV1.paperSize === 'F4' ? 'F4' : 'A4',
      };
    }
  } catch {
    // Fall back to sample data
  }

  const sample = createDefaultSampleRecord();
  return {
    school: structuredClone(DEFAULT_SCHOOL_SETTINGS),
    students: [sample],
    activeStudentId: sample.id,
    narrativeBank: structuredClone(DEFAULT_NARRATIVE_BANK),
    paperSize: 'A4',
  };
}

export default function App() {
  const initialRef = useRef<StoredStateV2 | null>(null);
  if (!initialRef.current) {
    initialRef.current = loadInitialState();
  }

  const [school, setSchool] = useState<SchoolSettings>(initialRef.current.school);
  const [students, setStudents] = useState<StudentRecord[]>(
    initialRef.current.students
  );
  const [activeStudentId, setActiveStudentId] = useState<string>(
    initialRef.current.activeStudentId
  );
  const [narrativeBank, setNarrativeBank] = useState<ElementBank[]>(
    initialRef.current.narrativeBank
  );
  const [paperSize, setPaperSize] = useState<PaperSize>(
    initialRef.current.paperSize
  );

  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [activeSection, setActiveSection] = useState<InputSectionId>('siswa');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(false);
  const [wordExporting, setWordExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRecord =
    students.find((s) => s.id === activeStudentId) || students[0];

  const updateActiveStudent = (nextStudent: StudentData) => {
    setStudents((prev) =>
      prev.map((rec) =>
        rec.id === activeRecord.id
          ? {
              ...rec,
              updatedAt: new Date().toISOString(),
              student: nextStudent,
            }
          : rec
      )
    );
  };

  const updateActiveAssessment = (nextAssessment: AssessmentState) => {
    setStudents((prev) =>
      prev.map((rec) =>
        rec.id === activeRecord.id
          ? {
              ...rec,
              updatedAt: new Date().toISOString(),
              assessment: nextAssessment,
            }
          : rec
      )
    );
  };

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      const payload: StoredStateV2 = {
        school,
        students,
        activeStudentId,
        narrativeBank,
        paperSize,
      };
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
    } catch {
      setFeedback({
        type: 'error',
        message:
          'Penyimpanan browser penuh. Gunakan gambar berukuran lebih kecil atau ekspor data murid ke file JSON/Word.',
      });
    }
  }, [school, students, activeStudentId, narrativeBank, paperSize]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    setWordExporting(true);
    try {
      const filename = await exportRaporToWord({
        school,
        student: activeRecord.student,
        assessment: activeRecord.assessment,
        narrativeBank,
        paperSize,
      });
      setFeedback({
        type: 'success',
        message: `Dokumen Word berhasil disimpan sebagai ${filename}`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? `Gagal mengekspor ke Word: ${err.message}`
            : 'Gagal mengekspor dokumen Word.',
      });
    } finally {
      setWordExporting(false);
    }
  };

  const handleExportJson = () => {
    const bundle: RaporBundle = {
      version: 2,
      exportedAt: new Date().toISOString(),
      school,
      student: activeRecord.student,
      assessment: activeRecord.assessment,
      narrativeBank,
    };
    const safeName = (activeRecord.student.namaLengkap || 'Murid_Baru')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_');
    const filename = `eRapor_${safeName}_${school.tahunAjaran.replace('/', '-')}.json`;

    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: `Data murid berhasil diekspor ke ${filename}`,
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<RaporBundle>;
        if (!parsed.student || !parsed.assessment) {
          throw new Error('Struktur file JSON tidak sesuai format e-Rapor.');
        }
        if (parsed.school) {
          setSchool({ ...DEFAULT_SCHOOL_SETTINGS, ...parsed.school });
        }
        if (
          Array.isArray(parsed.narrativeBank) &&
          parsed.narrativeBank.length === 3
        ) {
          setNarrativeBank(parsed.narrativeBank);
        }

        const importedRecord: StudentRecord = {
          id: createStudentId(),
          updatedAt: new Date().toISOString(),
          student: { ...EMPTY_STUDENT, ...parsed.student },
          assessment: normalizeAssessmentState(parsed.assessment),
        };

        setStudents((prev) => [...prev, importedRecord]);
        setActiveStudentId(importedRecord.id);
        setConfirmDeleteStudent(false);

        setFeedback({
          type: 'success',
          message: `Data rapor ${importedRecord.student.namaLengkap || 'murid'} ditambahkan ke daftar tanpa menimpa murid sebelumnya.`,
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'File JSON gagal dibaca. Pastikan file berasal dari ekspor e-Rapor.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewStudent = () => {
    const newRec = createEmptyStudentRecord();
    setStudents((prev) => [...prev, newRec]);
    setActiveStudentId(newRec.id);
    setConfirmDeleteStudent(false);
    setActiveSection('siswa');
    if (viewMode === 'bank') {
      setViewMode('input');
    }
    setFeedback({
      type: 'success',
      message: `Murid baru ditambahkan (Total ${students.length + 1} murid tersimpan). Data murid sebelumnya tetap aman.`,
    });
  };

  const handleDeleteActiveStudent = () => {
    if (students.length <= 1) {
      const fresh = createEmptyStudentRecord();
      setStudents([fresh]);
      setActiveStudentId(fresh.id);
      setConfirmDeleteStudent(false);
      setFeedback({
        type: 'success',
        message: 'Data murid dikosongkan.',
      });
      return;
    }

    const remaining = students.filter((s) => s.id !== activeRecord.id);
    setStudents(remaining);
    setActiveStudentId(remaining[0].id);
    setConfirmDeleteStudent(false);
    setFeedback({
      type: 'success',
      message: `Data murid "${activeRecord.student.namaLengkap || 'Tanpa Nama'}" telah dihapus dari daftar.`,
    });
  };

  const pageRuleCss =
    paperSize === 'F4'
      ? `@page { size: 215mm 330mm; margin: 13mm 14mm; }`
      : `@page { size: 210mm 297mm; margin: 13mm 14mm; }`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <style>{pageRuleCss}</style>

      {/* ================================================================
          TOP BAR (3-Zone Contract, Hidden on Print)
          ================================================================ */}
      <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setViewMode('input')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
          >
            e-Rapor TK Sinar Dunia
          </button>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {(
              [
                { id: 'input', label: 'Input Guru' },
                { id: 'preview', label: 'Pratinjau Rapor' },
                { id: 'split', label: 'Split View' },
                { id: 'bank', label: 'Bank Narasi' },
              ] as { id: ViewMode; label: string }[]
            ).map((nav) => {
              const active = viewMode === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setViewMode(nav.id)}
                  className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-sky-700 text-sky-800 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'input', label: 'Input Guru' },
              { id: 'preview', label: 'Pratinjau Rapor' },
              { id: 'bank', label: 'Bank Narasi' },
            ] as { id: ViewMode; label: string }[]
          ).map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setViewMode(nav.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${
                viewMode === nav.id
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* ================================================================
          WORKSPACE TOOLBAR (Multi-Student Selector + Paper + Word + JSON)
          ================================================================ */}
      <div className="no-print bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Multi-Student Switcher & Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label htmlFor="student-switcher" className="font-semibold text-slate-700">
              Murid Aktif:
            </label>
            <select
              id="student-switcher"
              value={activeRecord.id}
              onChange={(e) => {
                setActiveStudentId(e.target.value);
                setConfirmDeleteStudent(false);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:outline-none max-w-[260px]"
            >
              {students.map((rec, index) => (
                <option key={rec.id} value={rec.id}>
                  {index + 1}.{' '}
                  {rec.student.namaLengkap.trim() || 'Murid Baru (Belum Dinamai)'}{' '}
                  {rec.student.kelas ? `— Kelas ${rec.student.kelas}` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddNewStudent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Tambah Murid Baru
            </button>

            {!confirmDeleteStudent ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteStudent(true)}
                title="Hapus murid aktif"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:border-rose-300 transition-colors whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1">
                <span className="text-xs font-medium text-rose-900">
                  Hapus murid ini?
                </span>
                <button
                  type="button"
                  onClick={handleDeleteActiveStudent}
                  className="rounded bg-rose-700 px-2 py-0.5 text-xs font-semibold text-white hover:bg-rose-800"
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteStudent(false)}
                  className="px-1.5 py-0.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
              </div>
            )}

            <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500">
              {students.length} Murid Tersimpan
            </span>
            <span className="text-slate-400 hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 font-mono-tabular">
              {school.tahunAjaran} ({school.semester})
            </span>
          </div>

          {/* Export & Paper Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5"
              role="group"
              aria-label="Ukuran kertas cetak"
            >
              {(['A4', 'F4'] as PaperSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPaperSize(size)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    paperSize === size
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kertas {size}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={wordExporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-700 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {wordExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {wordExporting ? 'Menyiapkan Word...' : 'Simpan Word (.docx)'}
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Simpan JSON
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Muat JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="no-print max-w-[1440px] mx-auto px-4 sm:px-6 pt-4">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* ================================================================
          MAIN WORKSPACE CONTENT
          ================================================================ */}
      <main className="print:p-0 print:m-0">
        {viewMode === 'input' && (
          <>
            <div className="no-print max-w-5xl mx-auto px-4 sm:px-6 py-6">
              <InputEditor
                school={school}
                onChangeSchool={setSchool}
                student={activeRecord.student}
                onChangeStudent={updateActiveStudent}
                assessment={activeRecord.assessment}
                onChangeAssessment={updateActiveAssessment}
                narrativeBank={narrativeBank}
                activeSection={activeSection}
                onChangeSection={setActiveSection}
              />
            </div>
            <div className="hidden print:block print-only-container">
              <RaporDocument
                school={school}
                student={activeRecord.student}
                assessment={activeRecord.assessment}
                narrativeBank={narrativeBank}
                paperSize={paperSize}
              />
            </div>
          </>
        )}

        {viewMode === 'preview' && (
          <div className="py-8 px-4 sm:px-6 print:p-0 rapor-preview-scaler">
            <div className="no-print max-w-[215mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Pratinjau dokumen cetak ukuran kertas{' '}
                <strong className="text-slate-900">{paperSize}</strong> (
                {paperSize === 'F4' ? '215 × 330 mm' : '210 × 297 mm'}).
              </span>
              <button
                type="button"
                onClick={() => setViewMode('input')}
                className="font-semibold text-sky-700 hover:underline"
              >
                Kembali ke Input Data
              </button>
            </div>
            <RaporDocument
              school={school}
              student={activeRecord.student}
              assessment={activeRecord.assessment}
              narrativeBank={narrativeBank}
              paperSize={paperSize}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 print:max-w-none print:p-0">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block">
              <div className="no-print xl:col-span-6">
                <InputEditor
                  school={school}
                  onChangeSchool={setSchool}
                  student={activeRecord.student}
                  onChangeStudent={updateActiveStudent}
                  assessment={activeRecord.assessment}
                  onChangeAssessment={updateActiveAssessment}
                  narrativeBank={narrativeBank}
                  activeSection={activeSection}
                  onChangeSection={setActiveSection}
                />
              </div>
              <div className="xl:col-span-6 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto rounded-xl border border-slate-200 bg-slate-200/70 p-4 print:border-0 print:bg-white print:p-0 print:max-h-none print:overflow-visible">
                <div className="no-print mb-3 flex items-center justify-between text-xs text-slate-600 px-1">
                  <span className="font-semibold text-slate-800">
                    Pratinjau Langsung ({paperSize})
                  </span>
                  <span>Gulir ke bawah untuk melihat seluruh halaman</span>
                </div>
                <div className="origin-top-left xl:scale-[0.68] xl:w-[147%] print:scale-100 print:w-full">
                  <RaporDocument
                    school={school}
                    student={activeRecord.student}
                    assessment={activeRecord.assessment}
                    narrativeBank={narrativeBank}
                    paperSize={paperSize}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'bank' && (
          <>
            <div className="no-print max-w-5xl mx-auto px-4 sm:px-6 py-6">
              <NarrativeBankEditor
                narrativeBank={narrativeBank}
                onChangeBank={setNarrativeBank}
              />
            </div>
            <div className="hidden print:block print-only-container">
              <RaporDocument
                school={school}
                student={activeRecord.student}
                assessment={activeRecord.assessment}
                narrativeBank={narrativeBank}
                paperSize={paperSize}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
