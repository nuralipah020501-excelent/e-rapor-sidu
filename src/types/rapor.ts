export type Predicate = 'BB' | 'MB' | 'BSH' | 'BSB';

export type PaperSize = 'A4' | 'F4';

export type ElementKey = 'agama' | 'jatiDiri' | 'literasi';

export type PoseKey = 'agama' | 'jatiDiri' | 'literasi' | 'ekskul' | 'kokurikuler';

export interface PosePhotoItem {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface DdtkChecklist {
  lingkarKepala: string;
  penglihatan: string;
  pendengaran: string;
  motorik: string;
  bahasaSosial: string;
  catatanTambahan: string;
}

export interface SchoolSettings {
  namaSekolah: string;
  namaYayasan: string;
  namaLembagaKop: string;
  npsn: string;
  nss: string;
  alamatCover: string;
  alamatKop: string;
  cpCover: string;
  cpKop: string;
  email: string;
  tahunAjaran: string;
  semester: string;
  kotaRapor: string;
  tanggalRapor: string;
  namaGuru: string;
  nipGuru: string;
  namaKoordinatorKokurikuler: string;
  nipKoordinatorKokurikuler: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  logoDataUrl: string | null;
}

export interface StudentData {
  namaLengkap: string;
  namaPanggilan: string;
  nik: string;
  nisnNipd: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan' | '';
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  anakKe: string;
  namaAyah: string;
  namaIbu: string;
  noHpOrtu: string;
  pekerjaanAyah: string;
  pekerjaanIbu: string;
  alamatJalan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  fotoAnakDataUrl: string | null;
  umur: string;
  kelas: string;
  tinggiBadan: string;
  beratBadan: string;
}

export interface IndicatorDefinition {
  id: string;
  label: string;
  texts: Record<Predicate, string>;
}

export interface CpDefinition {
  id: string;
  text: string;
  mappedIndicatorIds: string[];
}

export interface ElementBank {
  id: ElementKey;
  code: string;
  title: string;
  openingTemplate: string;
  closingTemplate: string;
  indicators: IndicatorDefinition[];
  cpList: CpDefinition[];
}

export interface AssessmentState {
  indicatorPredicates: Record<string, Predicate>;
  cpOverrides: Record<string, Predicate | undefined>;
  customNarratives: Partial<Record<ElementKey, string>>;
  posePhotos: Record<PoseKey, PosePhotoItem[]>;
  ekskulText: string;
  kokurikulerText: string;
  refleksiGuru: string;
  refleksiOrtu: string;
  ddtkCheck: DdtkChecklist;
  deteksiDini: string;
  kehadiran: {
    sakit: string;
    izin: string;
    tanpaKeterangan: string;
  };
  namaOrtuTtd: string;
}

export interface StudentRecord {
  id: string;
  updatedAt: string;
  student: StudentData;
  assessment: AssessmentState;
}

export interface RaporBundle {
  version: number;
  exportedAt: string;
  school: SchoolSettings;
  student: StudentData;
  assessment: AssessmentState;
  narrativeBank: ElementBank[];
}
