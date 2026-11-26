import React from 'react';
import { PREDICATE_LABELS } from '../data/defaultData';
import type {
  AssessmentState,
  ElementBank,
  PaperSize,
  PoseKey,
  PosePhotoItem,
  Predicate,
  SchoolSettings,
  StudentData,
} from '../types/rapor';
import { generateElementNarrative, getCpPredicate } from '../utils/narrativeGenerator';
import { CornerOrnament } from './CoverOrnaments';
import { SchoolLogo } from './DefaultSchoolLogo';

interface RaporDocumentProps {
  school: SchoolSettings;
  student: StudentData;
  assessment: AssessmentState;
  narrativeBank: ElementBank[];
  paperSize: PaperSize;
}

const PREDICATES: Predicate[] = ['BB', 'MB', 'BSH', 'BSB'];

const PosePhotoBox: React.FC<{
  photos: PosePhotoItem[];
  title: string;
}> = ({ photos, title }) => {
  const slotCount = Math.max(3, photos.length);
  const slots: (PosePhotoItem | null)[] = Array.from(
    { length: slotCount },
    (_, i) => photos[i] || null
  );

  return (
    <div className="border border-slate-900 bg-white p-2.5 rapor-avoid-break">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-2 text-center">
        POSE KEGIATAN — {title}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {slots.map((item, idx) => (
          <div
            key={item?.id || `empty-${idx}`}
            className="flex flex-col items-center justify-between border border-slate-300 p-1.5 bg-slate-50/40 min-h-[116px]"
          >
            {item?.dataUrl ? (
              <>
                <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                  <img
                    src={item.dataUrl}
                    alt={item.caption || `Pose kegiatan ${title} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="max-h-32 w-full object-contain"
                  />
                </div>
                {item.caption.trim() && (
                  <p className="mt-1 text-[9.5px] italic text-slate-700 text-center leading-tight">
                    {item.caption}
                  </p>
                )}
              </>
            ) : (
              <div className="flex-1 w-full border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px] text-center px-1">
                <span>Foto Kegiatan {idx + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const RaporDocument: React.FC<RaporDocumentProps> = ({
  school,
  student,
  assessment,
  narrativeBank,
  paperSize,
}) => {
  const sheetClass =
    paperSize === 'F4' ? 'rapor-sheet rapor-sheet-f4' : 'rapor-sheet rapor-sheet-a4';
  const coverFrameMinH =
    paperSize === 'F4' ? 'min-h-[296mm]' : 'min-h-[265mm]';

  const nicknameForNarrative =
    student.namaPanggilan.trim() ||
    student.namaLengkap.trim().split(' ')[0] ||
    '...';

  const getEffectiveNarrative = (el: ElementBank) => {
    const manual = assessment.customNarratives[el.id];
    if (typeof manual === 'string' && manual.trim().length > 0) {
      return manual;
    }
    return generateElementNarrative(
      el,
      assessment.indicatorPredicates,
      nicknameForNarrative
    );
  };

  const formatTTL = () => {
    if (student.tempatLahir && student.tanggalLahir) {
      return `${student.tempatLahir}, ${student.tanggalLahir}`;
    }
    return student.tempatLahir || student.tanggalLahir || '-';
  };

  const renderCpElementBlock = (el: ElementBank, poseKey: PoseKey) => {
    const narrativeText = getEffectiveNarrative(el);
    const posePhotos = assessment.posePhotos[poseKey] || [];

    return (
      <div key={el.id} className="mb-4">
        <table className="w-full border-collapse border border-slate-900 text-[11.5px] leading-snug">
          <thead>
            <tr className="bg-slate-100">
              <th
                colSpan={2}
                className="border border-slate-900 px-2.5 py-1.5 text-left font-bold text-slate-900"
              >
                {el.code}. {el.title}
              </th>
              <th
                colSpan={4}
                className="border border-slate-900 px-2 py-1 text-center font-bold text-slate-900 text-[10.5px]"
              >
                TINGKAT KETERCAPAIAN
              </th>
            </tr>
            <tr className="bg-slate-50 text-[10.5px]">
              <th className="border border-slate-900 px-2 py-1 w-9 text-center font-bold">
                NO
              </th>
              <th className="border border-slate-900 px-2.5 py-1 text-left font-bold">
                CAPAIAN PEMBELAJARAN
              </th>
              {PREDICATES.map((pred) => (
                <th
                  key={pred}
                  className="border border-slate-900 px-1.5 py-1 w-11 text-center font-bold"
                >
                  {pred}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {el.cpList.map((cp, idx) => {
              const selectedPred = getCpPredicate(
                cp,
                assessment.indicatorPredicates,
                assessment.cpOverrides
              );
              return (
                <tr key={cp.id}>
                  <td className="border border-slate-900 px-2 py-1.5 text-center align-top font-mono-tabular">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-900 px-2.5 py-1.5 align-top text-justify">
                    {cp.text}
                  </td>
                  {PREDICATES.map((pred) => {
                    const isSelected = selectedPred === pred;
                    return (
                      <td
                        key={pred}
                        className={`border border-slate-900 px-1 py-1.5 text-center align-middle font-bold ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-950'
                            : 'text-slate-300'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Kotak Narasi Otomatis */}
            <tr className="rapor-avoid-break">
              <td
                colSpan={6}
                className="border border-slate-900 px-3 py-2.5 bg-white"
              >
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-900 mb-1">
                  Deskripsi Capaian {el.code}. {el.title}:
                </div>
                <p className="text-[11.5px] leading-relaxed text-justify text-slate-900 whitespace-pre-line">
                  {narrativeText}
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Kotak Pose Kegiatan (Minimal 3 Foto Grid) */}
        <div className="mt-2">
          <PosePhotoBox photos={posePhotos} title={el.title} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 print:space-y-0 font-rapor text-slate-900">
      {/* ================================================================
          HALAMAN 1: SAMPUL (COVER)
          ================================================================ */}
      <section className={`${sheetClass} rapor-page-break`}>
        <div
          className={`relative border-2 border-purple-900 p-6 sm:p-8 flex flex-col justify-between ${coverFrameMinH} ${
            paperSize === 'F4' ? 'rapor-cover-frame-f4' : 'rapor-cover-frame'
          }`}
        >
          <div className="absolute top-1.5 left-1.5">
            <CornerOrnament position="top-left" color="#6B21A8" />
          </div>
          <div className="absolute top-1.5 right-1.5">
            <CornerOrnament position="top-right" color="#6B21A8" />
          </div>
          <div className="absolute bottom-1.5 left-1.5">
            <CornerOrnament position="bottom-left" color="#6B21A8" />
          </div>
          <div className="absolute bottom-1.5 right-1.5">
            <CornerOrnament position="bottom-right" color="#6B21A8" />
          </div>

          <div className="border border-purple-300 flex-1 flex flex-col items-center justify-between px-6 py-12 text-center">
            <div className="mt-4 space-y-2">
              <h1 className="text-[24px] font-bold tracking-wider uppercase text-slate-900 leading-tight">
                LAPORAN
              </h1>
              <h2 className="text-[20px] font-bold tracking-wide uppercase text-slate-900 leading-snug">
                HASIL BELAJAR PESERTA DIDIK
              </h2>
              <h3 className="text-[18px] font-bold tracking-wide uppercase text-slate-800 leading-snug">
                PENDIDIKAN ANAK USIA DINI
              </h3>
            </div>

            <div className="my-8 flex flex-col items-center">
              <SchoolLogo
                logoDataUrl={school.logoDataUrl}
                schoolName={school.namaSekolah}
                className="w-40 h-40"
              />
            </div>

            <div className="max-w-md space-y-1.5">
              <div className="text-[20px] font-bold tracking-wide uppercase text-slate-900">
                {school.namaSekolah || 'TK SINAR DUNIA'}
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-800">
                Alamat: {school.alamatCover}
              </p>
              <p className="text-[12.5px] text-slate-800">
                CP: {school.cpCover}, Email: {school.email}
              </p>
            </div>

            <div className="w-full max-w-md mt-8 mb-4">
              <div className="border-4 border-double border-purple-800 p-1">
                <div className="border-2 border-dashed border-purple-700 px-5 py-4 bg-purple-50/30">
                  <div className="text-[12px] uppercase tracking-wider text-purple-900 font-semibold mb-1">
                    Nama Anak:
                  </div>
                  <div className="text-[18px] font-bold uppercase tracking-wide text-slate-950 min-h-[28px]">
                    {student.namaLengkap || '................................................'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          HALAMAN 2: IDENTITAS / DATA DIRI ANAK
          ================================================================ */}
      <section className={`${sheetClass} rapor-page-break`}>
        <div className="flex flex-col justify-between min-h-[260mm]">
          <div>
            <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-3 mb-5">
              <SchoolLogo
                logoDataUrl={school.logoDataUrl}
                schoolName={school.namaSekolah}
                className="w-16 h-16 shrink-0"
              />
              <div className="flex-1 text-center pr-6">
                <div className="text-[12.5px] font-bold uppercase leading-tight text-slate-900">
                  KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA
                </div>
                <div className="text-[11px] font-bold uppercase leading-tight text-slate-800 mt-1">
                  DIREKTORAT JENDERAL PENDIDIKAN ANAK USIA DINI, PENDIDIKAN DASAR, DAN PENDIDIKAN MENENGAH
                </div>
              </div>
            </div>

            <h2 className="text-center text-[16px] font-bold uppercase tracking-wider underline underline-offset-4 mb-5">
              DATA DIRI ANAK
            </h2>

            <table className="w-full border-collapse text-[12.5px] leading-relaxed">
              <tbody>
                <tr>
                  <td className="w-7 py-1.5 align-top font-mono-tabular">1.</td>
                  <td className="w-56 py-1.5 align-top">Nama Anak / Nama Panggilan</td>
                  <td className="w-4 py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top font-semibold">
                    {student.namaLengkap || '-'}
                    {student.namaPanggilan ? ` / ${student.namaPanggilan}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">2.</td>
                  <td className="py-1.5 align-top">NIK</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top font-mono-tabular">
                    {student.nik || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">3.</td>
                  <td className="py-1.5 align-top">NISN / NIPD</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top font-mono-tabular">
                    {student.nisnNipd || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">4.</td>
                  <td className="py-1.5 align-top">Jenis Kelamin</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top">{student.jenisKelamin || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">5.</td>
                  <td className="py-1.5 align-top">Tempat, Tanggal Lahir</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top">{formatTTL()}</td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">6.</td>
                  <td className="py-1.5 align-top">Agama</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top">{student.agama || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">7.</td>
                  <td className="py-1.5 align-top">Anak ke-</td>
                  <td className="py-1.5 align-top text-center">:</td>
                  <td className="py-1.5 align-top">{student.anakKe || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">8.</td>
                  <td className="py-1.5 align-top font-semibold" colSpan={3}>
                    Orang Tua / Wali
                  </td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">a. Nama Ayah</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.namaAyah || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">b. Nama Ibu</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.namaIbu || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">c. Nomor HP</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top font-mono-tabular">
                    {student.noHpOrtu || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">9.</td>
                  <td className="py-1.5 align-top font-semibold" colSpan={3}>
                    Pekerjaan Orang Tua / Wali
                  </td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">a. Ayah</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.pekerjaanAyah || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">b. Ibu</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.pekerjaanIbu || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 align-top font-mono-tabular">10.</td>
                  <td className="py-1.5 align-top font-semibold" colSpan={3}>
                    Alamat Orang Tua / Wali
                  </td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">a. Nama Jalan / Desa</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.alamatJalan || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">b. Kecamatan</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.kecamatan || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">c. Kabupaten / Kota</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.kabupatenKota || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">d. Provinsi</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top">{student.provinsi || '-'}</td>
                </tr>
                <tr>
                  <td />
                  <td className="py-1 pl-4 align-top">e. Kode Pos</td>
                  <td className="py-1 align-top text-center">:</td>
                  <td className="py-1 align-top font-mono-tabular">
                    {student.kodePos || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 pt-4 flex items-end justify-between px-4 rapor-avoid-break">
            <div className="flex flex-col items-center">
              <div className="w-[3cm] h-[4cm] border border-slate-900 flex items-center justify-center overflow-hidden bg-slate-50">
                {student.fotoAnakDataUrl ? (
                  <img
                    src={student.fotoAnakDataUrl}
                    alt={`Pas foto ${student.namaLengkap || 'Anak'}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[11px] text-slate-500 px-2">
                    Pas Foto
                    <br />
                    3 x 4
                  </div>
                )}
              </div>
            </div>

            <div className="text-[12.5px] leading-snug w-72">
              <div>
                {school.kotaRapor || 'Malang'}, {school.tanggalRapor || '...................'}
              </div>
              <div className="mt-0.5">
                Kepala Sekolah {school.namaSekolah || 'TK SINAR DUNIA'}
              </div>
              <div className="h-20" />
              <div className="font-bold underline underline-offset-2">
                {school.namaKepalaSekolah || 'LENI NURLIANAH, S.Pd.AUD'}
              </div>
              <div>NIP. {school.nipKepalaSekolah || '-'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          HALAMAN 3+: LAPORAN HASIL BELAJAR PESERTA DIDIK FASE FONDASI
          ================================================================ */}
      <section className={sheetClass}>
        <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-3 mb-4">
          <SchoolLogo
            logoDataUrl={school.logoDataUrl}
            schoolName={school.namaSekolah}
            className="w-20 h-20 shrink-0"
          />
          <div className="flex-1 text-center">
            <div className="text-[13px] font-bold uppercase tracking-wide text-slate-900">
              {school.namaYayasan}
            </div>
            <div className="text-[15px] font-bold uppercase tracking-wide text-slate-950 leading-tight mt-0.5">
              {school.namaLembagaKop}
            </div>
            <div className="text-[11px] text-slate-800 mt-1 font-mono-tabular">
              NPSN: {school.npsn} | NSS: {school.nss}
            </div>
            <div className="text-[11px] text-slate-800">
              Email: {school.email} | CP: {school.cpKop}
            </div>
            <div className="text-[11px] text-slate-800">
              {school.alamatKop}
            </div>
          </div>
        </div>

        <h2 className="text-center text-[14px] font-bold uppercase tracking-wide mb-3">
          LAPORAN HASIL BELAJAR PESERTA DIDIK FASE FONDASI
        </h2>

        <table className="w-full border-collapse border border-slate-900 text-[11.5px] mb-4">
          <tbody>
            <tr>
              <td className="border border-slate-900 px-2.5 py-1 w-32 font-semibold bg-slate-50">
                Nama
              </td>
              <td className="border border-slate-900 px-2.5 py-1 w-[34%]">
                {student.namaLengkap || '-'}
              </td>
              <td className="border border-slate-900 px-2.5 py-1 w-32 font-semibold bg-slate-50">
                Tahun Ajaran
              </td>
              <td className="border border-slate-900 px-2.5 py-1 font-mono-tabular">
                {school.tahunAjaran}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                NIK
              </td>
              <td className="border border-slate-900 px-2.5 py-1 font-mono-tabular">
                {student.nik || '-'}
              </td>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                Semester
              </td>
              <td className="border border-slate-900 px-2.5 py-1">
                {school.semester}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                Umur
              </td>
              <td className="border border-slate-900 px-2.5 py-1">
                {student.umur || '-'}
              </td>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                Tinggi Badan
              </td>
              <td className="border border-slate-900 px-2.5 py-1">
                {student.tinggiBadan || '-'}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                Kelas
              </td>
              <td className="border border-slate-900 px-2.5 py-1">
                {student.kelas || '-'}
              </td>
              <td className="border border-slate-900 px-2.5 py-1 font-semibold bg-slate-50">
                Berat Badan
              </td>
              <td className="border border-slate-900 px-2.5 py-1">
                {student.beratBadan || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {narrativeBank.map((el) => renderCpElementBlock(el, el.id))}

        {/* Kegiatan Ekstrakurikuler */}
        <div className="mb-4 rapor-avoid-break">
          <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 px-2.5 py-1.5 text-left font-bold">
                  KEGIATAN EKSTRAKURIKULER
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-2.5 text-justify leading-relaxed min-h-[48px] whitespace-pre-line">
                  {assessment.ekskulText.trim() ||
                    'Ananda mengikuti kegiatan ekstrakurikuler sesuai minat dan bakat dengan baik.'}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2">
            <PosePhotoBox
              photos={assessment.posePhotos.ekskul || []}
              title="KEGIATAN EKSTRAKURIKULER"
            />
          </div>
        </div>

        {/* Kegiatan Kokurikuler */}
        <div className="mb-4 rapor-avoid-break">
          <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 px-2.5 py-1.5 text-left font-bold">
                  KEGIATAN KOKURIKULER
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-2.5 text-justify leading-relaxed min-h-[48px] whitespace-pre-line">
                  {assessment.kokurikulerText.trim() ||
                    'Ananda berpartisipasi aktif dalam kegiatan kokurikuler / projek penguatan profil pelajar Pancasila.'}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2">
            <PosePhotoBox
              photos={assessment.posePhotos.kokurikuler || []}
              title="KEGIATAN KOKURIKULER"
            />
          </div>
        </div>

        {/* Keterangan Tingkat Ketercapaian */}
        <div className="mb-4 border border-slate-900 p-2.5 text-[11px] bg-slate-50/60 rapor-avoid-break">
          <div className="font-bold uppercase mb-1">
            Keterangan Tingkat Ketercapaian:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PREDICATES.map((pred) => (
              <div key={pred}>
                <span className="font-bold">{pred}</span> :{' '}
                {PREDICATE_LABELS[pred].full}
              </div>
            ))}
          </div>
        </div>

        {/* Refleksi Guru */}
        <div className="mb-4 rapor-avoid-break">
          <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 px-2.5 py-1.5 text-left font-bold">
                  REFLEKSI GURU
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-2.5 text-justify leading-relaxed whitespace-pre-line">
                  {assessment.refleksiGuru.trim() || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Refleksi Orang Tua */}
        <div className="mb-4 rapor-avoid-break">
          <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 px-2.5 py-1.5 text-left font-bold">
                  REFLEKSI ORANG TUA
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-2.5 leading-loose">
                  {assessment.refleksiOrtu.trim() ? (
                    <p className="text-justify whitespace-pre-line">
                      {assessment.refleksiOrtu}
                    </p>
                  ) : (
                    <div className="space-y-3 py-1 text-slate-400 select-none">
                      <div className="border-b border-dotted border-slate-600 h-4" />
                      <div className="border-b border-dotted border-slate-600 h-4" />
                      <div className="border-b border-dotted border-slate-600 h-4" />
                      <div className="border-b border-dotted border-slate-600 h-4" />
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deteksi Dini Tumbuh Kembang Anak */}
        <div className="mb-4 rapor-avoid-break">
          <table className="w-full border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 px-2.5 py-1.5 text-left font-bold">
                  DETEKSI DINI TUMBUH KEMBANG ANAK
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-1.5 bg-slate-50/70 text-[11px]">
                  <span className="font-semibold">Tinggi Badan (TB):</span>{' '}
                  <span className="font-mono-tabular mr-4">
                    {student.tinggiBadan || '-'}
                  </span>
                  <span className="font-semibold">Berat Badan (BB):</span>{' '}
                  <span className="font-mono-tabular mr-4">
                    {student.beratBadan || '-'}
                  </span>
                  {assessment.ddtkCheck?.lingkarKepala && (
                    <>
                      <span className="font-semibold">Lingkar Kepala:</span>{' '}
                      <span className="font-mono-tabular">
                        {assessment.ddtkCheck.lingkarKepala}
                      </span>
                    </>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-3 py-2.5 text-justify leading-relaxed whitespace-pre-line">
                  {assessment.deteksiDini.trim() || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Informasi Kehadiran */}
        <div className="mb-6 rapor-avoid-break">
          <table className="w-full max-w-sm border-collapse border border-slate-900 text-[11.5px]">
            <thead>
              <tr className="bg-slate-100">
                <th
                  colSpan={2}
                  className="border border-slate-900 px-2.5 py-1.5 text-left font-bold"
                >
                  INFORMASI KEHADIRAN
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-2.5 py-1 w-44">Sakit</td>
                <td className="border border-slate-900 px-2.5 py-1 font-mono-tabular">
                  {assessment.kehadiran.sakit || '0'} Hari
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-2.5 py-1">Izin</td>
                <td className="border border-slate-900 px-2.5 py-1 font-mono-tabular">
                  {assessment.kehadiran.izin || '0'} Hari
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-2.5 py-1">
                  Tanpa Keterangan
                </td>
                <td className="border border-slate-900 px-2.5 py-1 font-mono-tabular">
                  {assessment.kehadiran.tanpaKeterangan || '0'} Hari
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Blok Tanda Tangan */}
        <div className="mt-6 text-[11.5px] leading-snug rapor-avoid-break">
          <div className="grid grid-cols-3 gap-3 items-start text-center">
            {/* Orang Tua / Wali (Kiri) */}
            <div>
              <div>Mengetahui,</div>
              <div>Orang Tua / Wali</div>
              <div className="h-20" />
              <div className="font-bold underline underline-offset-2">
                {assessment.namaOrtuTtd.trim()
                  ? assessment.namaOrtuTtd
                  : '( .................................. )'}
              </div>
            </div>

            {/* Koordinator Kokurikuler (Tengah) */}
            <div>
              <div>Mengetahui,</div>
              <div>Koordinator Kokurikuler</div>
              <div className="h-20" />
              <div className="font-bold underline underline-offset-2">
                {school.namaKoordinatorKokurikuler?.trim()
                  ? school.namaKoordinatorKokurikuler
                  : '( .................................. )'}
              </div>
              <div>NIP. {school.nipKoordinatorKokurikuler || '-'}</div>
            </div>

            {/* Guru Kelas (Kanan) */}
            <div>
              <div>
                {school.kotaRapor || 'Malang'},{' '}
                {school.tanggalRapor || '...................'}
              </div>
              <div>Guru Kelas {student.kelas || 'B'}</div>
              <div className="h-20" />
              <div className="font-bold underline underline-offset-2">
                {school.namaGuru.trim()
                  ? school.namaGuru
                  : '( .................................. )'}
              </div>
              <div>NIP. {school.nipGuru || '-'}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-72 text-center">
              <div>Mengetahui,</div>
              <div>Kepala {school.namaSekolah || 'TK SINAR DUNIA'}</div>
              <div className="h-20" />
              <div className="font-bold underline underline-offset-2">
                {school.namaKepalaSekolah || 'LENI NURLIANAH, S.Pd.AUD'}
              </div>
              <div>NIP. {school.nipKepalaSekolah || '-'}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
