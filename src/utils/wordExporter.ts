import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
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
import { generateElementNarrative, getCpPredicate } from './narrativeGenerator';

const PREDICATES: Predicate[] = ['BB', 'MB', 'BSH', 'BSB'];

interface DecodedImage {
  data: Uint8Array;
  type: 'png' | 'jpg';
  width: number;
  height: number;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || 400,
        height: img.naturalHeight || 300,
      });
    img.onerror = () => resolve({ width: 400, height: 300 });
    img.src = src;
  });
}

async function decodeDataUrlForDocx(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<DecodedImage | null> {
  try {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return null;
    const rawFormat = match[1].toLowerCase();
    const base64 = match[2];

    const dims = await loadImageDimensions(dataUrl);
    const ratio = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
    const width = Math.max(24, Math.round(dims.width * ratio));
    const height = Math.max(24, Math.round(dims.height * ratio));

    // Convert non-png/jpg (e.g., webp) via canvas to jpg so docx ImageRun always succeeds
    if (rawFormat !== 'png' && rawFormat !== 'jpeg' && rawFormat !== 'jpg') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        const img = new Image();
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.onerror = () => res();
          img.src = dataUrl;
        });
        ctx.drawImage(img, 0, 0, width, height);
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
        const jpgBase64 = jpgUrl.split(',')[1] || '';
        return {
          data: base64ToUint8Array(jpgBase64),
          type: 'jpg',
          width,
          height,
        };
      }
    }

    return {
      data: base64ToUint8Array(base64),
      type: rawFormat === 'png' ? 'png' : 'jpg',
      width,
      height,
    };
  } catch {
    return null;
  }
}

async function renderDefaultLogoPng(sizePx: number): Promise<DecodedImage | null> {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
      <polygon points="110,10 206,80 169,198 51,198 14,80" fill="#1D4ED8" stroke="#FACC15" stroke-width="6" stroke-linejoin="round"/>
      <polygon points="110,21 195,84 162,188 58,188 25,84" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="110" cy="84" r="24" fill="#FDE047" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M68,125 C84,117 98,120 110,129 C122,120 136,117 152,125 L152,146 C136,139 122,141 110,149 C98,141 84,139 68,146 Z" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="2"/>
      <line x1="110" y1="129" x2="110" y2="149" stroke="#1E3A8A" stroke-width="2"/>
      <text x="110" y="168" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="700" font-family="Arial, sans-serif">TK SINAR DUNIA</text>
      <text x="110" y="183" text-anchor="middle" fill="#FDE047" font-size="11" font-weight="700" font-family="Arial, sans-serif">NGAJUM</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = sizePx * 2;
    canvas.height = sizePx * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, sizePx * 2, sizePx * 2);
    }
    URL.revokeObjectURL(url);
    const pngDataUrl = canvas.toDataURL('image/png');
    const base64 = pngDataUrl.split(',')[1] || '';
    return {
      data: base64ToUint8Array(base64),
      type: 'png',
      width: sizePx,
      height: sizePx,
    };
  } catch {
    return null;
  }
}

const SOLID_BORDER = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: '111827',
};

const ALL_SOLID_BORDERS = {
  top: SOLID_BORDER,
  bottom: SOLID_BORDER,
  left: SOLID_BORDER,
  right: SOLID_BORDER,
};

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const CELL_MARGINS = {
  top: 80,
  bottom: 80,
  left: 120,
  right: 120,
};

function txt(
  text: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    underline?: boolean;
  } = {}
): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 21, // 10.5pt default
    color: opts.color ?? '111827',
    underline: opts.underline ? {} : undefined,
    font: 'Times New Roman',
  });
}

async function buildPoseTable(
  title: string,
  photos: PosePhotoItem[]
): Promise<Table> {
  const slots: (PosePhotoItem | null)[] = [...photos];
  while (slots.length < 3) {
    slots.push(null);
  }

  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: ALL_SOLID_BORDERS,
          margins: CELL_MARGINS,
          shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                txt(`POSE KEGIATAN — ${title}`, { bold: true, size: 20 }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Chunk into rows of 3 columns
  for (let i = 0; i < slots.length; i += 3) {
    const rowSlice = slots.slice(i, i + 3);
    while (rowSlice.length < 3) rowSlice.push(null);

    const cells: TableCell[] = [];
    for (let colIdx = 0; colIdx < 3; colIdx++) {
      const item = rowSlice[colIdx];
      const cellChildren: Paragraph[] = [];

      if (item && item.dataUrl) {
        const decoded = await decodeDataUrlForDocx(item.dataUrl, 165, 130);
        if (decoded) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [
                new ImageRun({
                  data: decoded.data,
                  type: decoded.type,
                  transformation: {
                    width: decoded.width,
                    height: decoded.height,
                  },
                }),
              ],
            })
          );
        }
        if (item.caption.trim()) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                txt(item.caption.trim(), {
                  italics: true,
                  size: 18,
                  color: '334155',
                }),
              ],
            })
          );
        }
      } else {
        cellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 280, after: 280 },
            children: [
              txt(`Foto Kegiatan ${i + colIdx + 1}`, {
                size: 18,
                color: '94A3B8',
                italics: true,
              }),
            ],
          })
        );
      }

      cells.push(
        new TableCell({
          width: { size: 33.33, type: WidthType.PERCENTAGE },
          borders: ALL_SOLID_BORDERS,
          margins: CELL_MARGINS,
          verticalAlign: VerticalAlign.CENTER,
          children: cellChildren,
        })
      );
    }

    rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

export async function exportRaporToWord(params: {
  school: SchoolSettings;
  student: StudentData;
  assessment: AssessmentState;
  narrativeBank: ElementBank[];
  paperSize: PaperSize;
}): Promise<string> {
  const { school, student, assessment, narrativeBank, paperSize } = params;

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

  const logoCover = school.logoDataUrl
    ? await decodeDataUrlForDocx(school.logoDataUrl, 150, 150)
    : await renderDefaultLogoPng(145);

  const logoSmall = school.logoDataUrl
    ? await decodeDataUrlForDocx(school.logoDataUrl, 72, 72)
    : await renderDefaultLogoPng(70);

  const fotoAnakImg = student.fotoAnakDataUrl
    ? await decodeDataUrlForDocx(student.fotoAnakDataUrl, 90, 120)
    : null;

  const formatTTL = () => {
    if (student.tempatLahir && student.tanggalLahir) {
      return `${student.tempatLahir}, ${student.tanggalLahir}`;
    }
    return student.tempatLahir || student.tanggalLahir || '-';
  };

  // =========================================================================
  // HALAMAN 1: SAMPUL (COVER)
  // =========================================================================
  const coverChildren: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [txt('LAPORAN', { bold: true, size: 42 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [txt('HASIL BELAJAR PESERTA DIDIK', { bold: true, size: 34 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [txt('PENDIDIKAN ANAK USIA DINI', { bold: true, size: 32 })],
    }),
  ];

  if (logoCover) {
    coverChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 600 },
        children: [
          new ImageRun({
            data: logoCover.data,
            type: logoCover.type,
            transformation: {
              width: logoCover.width,
              height: logoCover.height,
            },
          }),
        ],
      })
    );
  }

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        txt(school.namaSekolah || 'TK SINAR DUNIA', { bold: true, size: 34 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [txt(`Alamat: ${school.alamatCover}`, { size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 700 },
      children: [
        txt(`CP: ${school.cpCover}, Email: ${school.email}`, { size: 22 }),
      ],
    }),
    new Table({
      width: { size: 78, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.DOUBLE, size: 12, color: '6B21A8' },
                bottom: { style: BorderStyle.DOUBLE, size: 12, color: '6B21A8' },
                left: { style: BorderStyle.DOUBLE, size: 12, color: '6B21A8' },
                right: { style: BorderStyle.DOUBLE, size: 12, color: '6B21A8' },
              },
              shading: { fill: 'FAF5FF', type: ShadingType.CLEAR },
              margins: { top: 180, bottom: 180, left: 240, right: 240 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 80 },
                  children: [
                    txt('NAMA ANAK:', {
                      bold: true,
                      size: 22,
                      color: '581C87',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(
                      (student.namaLengkap || '........................................').toUpperCase(),
                      { bold: true, size: 30 }
                    ),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // =========================================================================
  // HALAMAN 2: DATA DIRI ANAK
  // =========================================================================
  const bioRows: [string, string, string][] = [
    [
      '1.',
      'Nama Anak / Nama Panggilan',
      `${student.namaLengkap || '-'}${student.namaPanggilan ? ` / ${student.namaPanggilan}` : ''}`,
    ],
    ['2.', 'NIK', student.nik || '-'],
    ['3.', 'NISN / NIPD', student.nisnNipd || '-'],
    ['4.', 'Jenis Kelamin', student.jenisKelamin || '-'],
    ['5.', 'Tempat, Tanggal Lahir', formatTTL()],
    ['6.', 'Agama', student.agama || '-'],
    ['7.', 'Anak ke-', student.anakKe || '-'],
    ['8.', 'Orang Tua / Wali', ''],
    ['', 'a. Nama Ayah', student.namaAyah || '-'],
    ['', 'b. Nama Ibu', student.namaIbu || '-'],
    ['', 'c. Nomor HP', student.noHpOrtu || '-'],
    ['9.', 'Pekerjaan Orang Tua / Wali', ''],
    ['', 'a. Ayah', student.pekerjaanAyah || '-'],
    ['', 'b. Ibu', student.pekerjaanIbu || '-'],
    ['10.', 'Alamat Orang Tua / Wali', ''],
    ['', 'a. Nama Jalan / Desa', student.alamatJalan || '-'],
    ['', 'b. Kecamatan', student.kecamatan || '-'],
    ['', 'c. Kabupaten / Kota', student.kabupatenKota || '-'],
    ['', 'd. Provinsi', student.provinsi || '-'],
    ['', 'e. Kode Pos', student.kodePos || '-'],
  ];

  const headerPage2 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 12, color: '111827' },
            },
            verticalAlign: VerticalAlign.CENTER,
            children: logoSmall
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: logoSmall.data,
                        type: logoSmall.type,
                        transformation: {
                          width: logoSmall.width,
                          height: logoSmall.height,
                        },
                      }),
                    ],
                  }),
                ]
              : [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 84, type: WidthType.PERCENTAGE },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 12, color: '111827' },
            },
            verticalAlign: VerticalAlign.CENTER,
            margins: { bottom: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  txt(
                    'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA',
                    { bold: true, size: 22 }
                  ),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  txt(
                    'DIREKTORAT JENDERAL PENDIDIKAN ANAK USIA DINI, PENDIDIKAN DASAR, DAN PENDIDIKAN MENENGAH',
                    { bold: true, size: 19 }
                  ),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const bioTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: bioRows.map(
      ([no, label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { top: 45, bottom: 45, left: 40, right: 40 },
              children: [new Paragraph({ children: [txt(no, { size: 22 })] })],
            }),
            new TableCell({
              width: { size: 36, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { top: 45, bottom: 45, left: 40, right: 40 },
              children: [
                new Paragraph({
                  children: [
                    txt(label, {
                      size: 22,
                      bold: value === '' && no !== '',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 4, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { top: 45, bottom: 45, left: 20, right: 20 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [txt(value !== '' ? ':' : '', { size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 54, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              margins: { top: 45, bottom: 45, left: 40, right: 40 },
              children: [
                new Paragraph({
                  children: [
                    txt(value, {
                      size: 22,
                      bold: no === '1.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });

  const page2BottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Table({
                width: { size: 48, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: ALL_SOLID_BORDERS,
                        margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        verticalAlign: VerticalAlign.CENTER,
                        children: fotoAnakImg
                          ? [
                              new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                  new ImageRun({
                                    data: fotoAnakImg.data,
                                    type: fotoAnakImg.type,
                                    transformation: {
                                      width: fotoAnakImg.width,
                                      height: fotoAnakImg.height,
                                    },
                                  }),
                                ],
                              }),
                            ]
                          : [
                              new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 400, after: 400 },
                                children: [txt('Pas Foto\n3 x 4', { size: 20, color: '64748B' })],
                              }),
                            ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: NO_BORDERS,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                children: [
                  txt(`${school.kotaRapor || 'Malang'}, ${school.tanggalRapor || '...................'}`, {
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 700 },
                children: [
                  txt(`Kepala Sekolah ${school.namaSekolah || 'TK SINAR DUNIA'}`, {
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  txt(school.namaKepalaSekolah || 'LENI NURLIANAH, S.Pd.AUD', {
                    bold: true,
                    underline: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  txt(`NIP. ${school.nipKepalaSekolah || '-'}`, { size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const page2Children: (Paragraph | Table)[] = [
    headerPage2,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 280, after: 280 },
      children: [txt('DATA DIRI ANAK', { bold: true, underline: true, size: 28 })],
    }),
    bioTable,
    new Paragraph({ spacing: { before: 350 }, children: [] }),
    page2BottomTable,
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // =========================================================================
  // HALAMAN 3+: LAPORAN HASIL BELAJAR FASE FONDASI
  // =========================================================================
  const kopSuratTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.DOUBLE, size: 12, color: '111827' },
            },
            verticalAlign: VerticalAlign.CENTER,
            margins: { bottom: 80 },
            children: logoSmall
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: logoSmall.data,
                        type: logoSmall.type,
                        transformation: {
                          width: logoSmall.width,
                          height: logoSmall.height,
                        },
                      }),
                    ],
                  }),
                ]
              : [new Paragraph('')],
          }),
          new TableCell({
            width: { size: 84, type: WidthType.PERCENTAGE },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.DOUBLE, size: 12, color: '111827' },
            },
            verticalAlign: VerticalAlign.CENTER,
            margins: { bottom: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt(school.namaYayasan, { bold: true, size: 22 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt(school.namaLembagaKop, { bold: true, size: 25 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  txt(`NPSN: ${school.npsn} | NSS: ${school.nss}`, { size: 18 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  txt(`Email: ${school.email} | CP: ${school.cpKop}`, { size: 18 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt(school.alamatKop, { size: 18 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const shortIdentityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      [
        ['Nama', student.namaLengkap || '-', 'Tahun Ajaran', school.tahunAjaran],
        ['NIK', student.nik || '-', 'Semester', school.semester],
        ['Umur', student.umur || '-', 'Tinggi Badan', student.tinggiBadan || '-'],
        ['Kelas', student.kelas || '-', 'Berat Badan', student.beratBadan || '-'],
      ].map(
        ([k1, v1, k2, v2]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 16, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [txt(k1, { bold: true, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                children: [new Paragraph({ children: [txt(v1, { size: 20 })] })],
              }),
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [txt(k2, { bold: true, size: 20 })] })],
              }),
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                children: [new Paragraph({ children: [txt(v2, { size: 20 })] })],
              }),
            ],
          })
      ),
    ].flat(),
  });

  const page3Children: (Paragraph | Table)[] = [
    kopSuratTable,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 160 },
      children: [
        txt('LAPORAN HASIL BELAJAR PESERTA DIDIK FASE FONDASI', {
          bold: true,
          size: 24,
        }),
      ],
    }),
    shortIdentityTable,
    new Paragraph({ spacing: { after: 140 }, children: [] }),
  ];

  // Capaian Pembelajaran Elements A, B, C
  for (const el of narrativeBank) {
    const cpRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            columnSpan: 2,
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [txt(`${el.code}. ${el.title}`, { bold: true, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            columnSpan: 4,
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt('TINGKAT KETERCAPAIAN', { bold: true, size: 18 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt('NO', { bold: true, size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 66, type: WidthType.PERCENTAGE },
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [txt('CAPAIAN PEMBELAJARAN', { bold: true, size: 18 })],
              }),
            ],
          }),
          ...PREDICATES.map(
            (pred) =>
              new TableCell({
                width: { size: 7, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [txt(pred, { bold: true, size: 18 })],
                  }),
                ],
              })
          ),
        ],
      }),
      ...el.cpList.map((cp, idx) => {
        const selected = getCpPredicate(
          cp,
          assessment.indicatorPredicates,
          assessment.cpOverrides
        );
        return new TableRow({
          children: [
            new TableCell({
              borders: ALL_SOLID_BORDERS,
              margins: CELL_MARGINS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [txt(String(idx + 1), { size: 20 })],
                }),
              ],
            }),
            new TableCell({
              borders: ALL_SOLID_BORDERS,
              margins: CELL_MARGINS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.BOTH,
                  children: [txt(cp.text, { size: 20 })],
                }),
              ],
            }),
            ...PREDICATES.map((pred) => {
              const isSelected = selected === pred;
              return new TableCell({
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: isSelected
                  ? { fill: 'D1FAE5', type: ShadingType.CLEAR }
                  : undefined,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      txt(isSelected ? '✓' : '', {
                        bold: true,
                        size: 20,
                        color: '065F46',
                      }),
                    ],
                  }),
                ],
              });
            }),
          ],
        });
      }),
      // Narrative row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 6,
            borders: ALL_SOLID_BORDERS,
            margins: { top: 100, bottom: 100, left: 130, right: 130 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  txt(`Deskripsi Capaian ${el.code}. ${el.title}:`, {
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.BOTH,
                children: [txt(getEffectiveNarrative(el), { size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ];

    page3Children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: cpRows,
      }),
      new Paragraph({ spacing: { after: 80 }, children: [] }),
      await buildPoseTable(el.title, assessment.posePhotos[el.id as PoseKey] || []),
      new Paragraph({ spacing: { after: 180 }, children: [] })
    );
  }

  // Helper for single-box narrative sections
  const buildBoxSection = (heading: string, bodyText: string, dotted = false) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: ALL_SOLID_BORDERS,
              margins: CELL_MARGINS,
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [txt(heading, { bold: true, size: 20 })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: ALL_SOLID_BORDERS,
              margins: { top: 100, bottom: 100, left: 130, right: 130 },
              children: dotted
                ? [
                    new Paragraph({
                      spacing: { after: 100 },
                      children: [
                        txt(
                          '........................................................................................................................................',
                          { size: 20, color: '64748B' }
                        ),
                      ],
                    }),
                    new Paragraph({
                      spacing: { after: 100 },
                      children: [
                        txt(
                          '........................................................................................................................................',
                          { size: 20, color: '64748B' }
                        ),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        txt(
                          '........................................................................................................................................',
                          { size: 20, color: '64748B' }
                        ),
                      ],
                    }),
                  ]
                : [
                    new Paragraph({
                      alignment: AlignmentType.BOTH,
                      children: [txt(bodyText, { size: 20 })],
                    }),
                  ],
            }),
          ],
        }),
      ],
    });

  // Ekskul + Pose
  page3Children.push(
    buildBoxSection(
      'KEGIATAN EKSTRAKURIKULER',
      assessment.ekskulText.trim() ||
        'Ananda mengikuti kegiatan ekstrakurikuler sesuai minat dan bakat dengan baik.'
    ),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
    await buildPoseTable('KEGIATAN EKSTRAKURIKULER', assessment.posePhotos.ekskul || []),
    new Paragraph({ spacing: { after: 180 }, children: [] })
  );

  // Kokurikuler + Pose
  page3Children.push(
    buildBoxSection(
      'KEGIATAN KOKURIKULER',
      assessment.kokurikulerText.trim() ||
        'Ananda berpartisipasi aktif dalam kegiatan kokurikuler / projek penguatan profil pelajar Pancasila.'
    ),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
    await buildPoseTable('KEGIATAN KOKURIKULER', assessment.posePhotos.kokurikuler || []),
    new Paragraph({ spacing: { after: 180 }, children: [] })
  );

  // Keterangan Tingkat Ketercapaian
  page3Children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              borders: ALL_SOLID_BORDERS,
              margins: CELL_MARGINS,
              shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    txt('KETERANGAN TINGKAT KETERCAPAIAN:', {
                      bold: true,
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: PREDICATES.map(
            (pred) =>
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: ALL_SOLID_BORDERS,
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    children: [
                      txt(`${pred} `, { bold: true, size: 19 }),
                      txt(`: ${PREDICATE_LABELS[pred].full}`, { size: 19 }),
                    ],
                  }),
                ],
              })
          ),
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 160 }, children: [] })
  );

  // Refleksi Guru, Refleksi Orang Tua, DDTK (with TB & BB)
  const ddtkMetrics = [
    `Tinggi Badan (TB): ${student.tinggiBadan || '-'}`,
    `Berat Badan (BB): ${student.beratBadan || '-'}`,
    assessment.ddtkCheck?.lingkarKepala
      ? `Lingkar Kepala: ${assessment.ddtkCheck.lingkarKepala}`
      : '',
  ]
    .filter(Boolean)
    .join('   |   ');

  const ddtkTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  txt('DETEKSI DINI TUMBUH KEMBANG ANAK', {
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_SOLID_BORDERS,
            margins: CELL_MARGINS,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [txt(ddtkMetrics, { bold: true, size: 19 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: ALL_SOLID_BORDERS,
            margins: { top: 100, bottom: 100, left: 130, right: 130 },
            children: [
              new Paragraph({
                alignment: AlignmentType.BOTH,
                children: [
                  txt(assessment.deteksiDini.trim() || '-', { size: 20 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  page3Children.push(
    buildBoxSection('REFLEKSI GURU', assessment.refleksiGuru.trim() || '-'),
    new Paragraph({ spacing: { after: 140 }, children: [] }),
    buildBoxSection(
      'REFLEKSI ORANG TUA',
      assessment.refleksiOrtu.trim(),
      !assessment.refleksiOrtu.trim()
    ),
    new Paragraph({ spacing: { after: 140 }, children: [] }),
    ddtkTable,
    new Paragraph({ spacing: { after: 160 }, children: [] })
  );

  // Informasi Kehadiran
  page3Children.push(
    new Table({
      width: { size: 46, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              borders: ALL_SOLID_BORDERS,
              margins: CELL_MARGINS,
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [txt('INFORMASI KEHADIRAN', { bold: true, size: 20 })],
                }),
              ],
            }),
          ],
        }),
        ...[
          ['Sakit', `${assessment.kehadiran.sakit || '0'} Hari`],
          ['Izin', `${assessment.kehadiran.izin || '0'} Hari`],
          ['Tanpa Keterangan', `${assessment.kehadiran.tanpaKeterangan || '0'} Hari`],
        ].map(
          ([k, v]) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 60, type: WidthType.PERCENTAGE },
                  borders: ALL_SOLID_BORDERS,
                  margins: CELL_MARGINS,
                  children: [new Paragraph({ children: [txt(k, { size: 20 })] })],
                }),
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  borders: ALL_SOLID_BORDERS,
                  margins: CELL_MARGINS,
                  children: [new Paragraph({ children: [txt(v, { size: 20 })] })],
                }),
              ],
            })
        ),
      ],
    }),
    new Paragraph({ spacing: { after: 280 }, children: [] })
  );

  // Signature Block (3 Columns: Orang Tua/Wali | Koordinator Kokurikuler | Guru Kelas)
  page3Children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [txt('Mengetahui,', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 700 },
                  children: [txt('Orang Tua / Wali', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(
                      assessment.namaOrtuTtd.trim() ||
                        '( ............................ )',
                      { bold: true, underline: true, size: 20 }
                    ),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [txt('Mengetahui,', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 700 },
                  children: [txt('Koordinator Kokurikuler', { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(
                      school.namaKoordinatorKokurikuler?.trim() ||
                        '( ............................ )',
                      { bold: true, underline: true, size: 20 }
                    ),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(`NIP. ${school.nipKoordinatorKokurikuler || '-'}`, {
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 33.34, type: WidthType.PERCENTAGE },
              borders: NO_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(
                      `${school.kotaRapor || 'Malang'}, ${school.tanggalRapor || '...................'}`,
                      { size: 20 }
                    ),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 700 },
                  children: [txt(`Guru Kelas ${student.kelas || 'B'}`, { size: 20 })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    txt(
                      school.namaGuru.trim() ||
                        '( ............................ )',
                      { bold: true, underline: true, size: 20 }
                    ),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [txt(`NIP. ${school.nipGuru || '-'}`, { size: 20 })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360 },
      children: [txt('Mengetahui,', { size: 21 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 700 },
      children: [
        txt(`Kepala ${school.namaSekolah || 'TK SINAR DUNIA'}`, { size: 21 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        txt(school.namaKepalaSekolah || 'LENI NURLIANAH, S.Pd.AUD', {
          bold: true,
          underline: true,
          size: 21,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [txt(`NIP. ${school.nipKepalaSekolah || '-'}`, { size: 21 })],
    })
  );

  // Page dimensions in twips (1 mm = 56.6929 twips)
  const pageSize =
    paperSize === 'F4'
      ? { width: 12190, height: 18711 } // 215mm x 330mm
      : { width: 11906, height: 16838 }; // 210mm x 297mm (A4)

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: pageSize,
            margin: {
              top: 794, // ~14mm
              bottom: 794,
              left: 850, // ~15mm
              right: 850,
            },
          },
        },
        children: [...coverChildren, ...page2Children, ...page3Children],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (student.namaLengkap || 'Murid_Baru')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const filename = `eRapor_${safeName}_${school.tahunAjaran.replace('/', '-')}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}
