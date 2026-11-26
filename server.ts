import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi pada panel Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractReadableAiError(err: unknown, fallback: string): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : fallback;
  if (rawMessage.includes('GEMINI_API_KEY')) {
    return { status: 500, message: rawMessage };
  }
  try {
    const parsed = JSON.parse(rawMessage) as {
      error?: { code?: number; message?: string; status?: string };
    };
    const code = parsed?.error?.code;
    const statusText = parsed?.error?.status;
    if (code === 503 || statusText === 'UNAVAILABLE') {
      return {
        status: 503,
        message: 'Layanan AI sedang sibuk sementara waktu (503). Silakan coba lagi beberapa saat lagi.',
      };
    }
    if (code === 429 || statusText === 'RESOURCE_EXHAUSTED') {
      return {
        status: 429,
        message: 'Batas permintaan layanan AI tercapai sementara (429). Silakan tunggu sebentar lalu coba lagi.',
      };
    }
    if (parsed?.error?.message) {
      return {
        status: typeof code === 'number' && code >= 400 && code < 600 ? code : 502,
        message: parsed.error.message,
      };
    }
  } catch {
    // Raw message is plain text
  }
  return { status: 502, message: rawMessage || fallback };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/ddtk/generate', async (req, res) => {
    try {
      const {
        namaLengkap,
        namaPanggilan,
        jenisKelamin,
        umur,
        tinggiBadan,
        beratBadan,
        lingkarKepala,
        penglihatan,
        pendengaran,
        motorik,
        bahasaSosial,
        catatanTambahan,
      } = req.body || {};

      const displayNickname =
        (typeof namaPanggilan === 'string' && namaPanggilan.trim()) ||
        (typeof namaLengkap === 'string' && namaLengkap.trim().split(' ')[0]) ||
        'Anak';

      const ai = getGeminiClient();

      const prompt = [
        `Susun narasi resmi bagian "DETEKSI DINI TUMBUH KEMBANG ANAK (DDTK)" untuk rapor PAUD TK Sinar Dunia berdasarkan data berikut:`,
        `- Nama Panggilan: ${displayNickname}`,
        `- Nama Lengkap: ${namaLengkap || '-'}`,
        `- Jenis Kelamin: ${jenisKelamin || '-'}`,
        `- Usia: ${umur || '-'}`,
        `- Tinggi Badan: ${tinggiBadan || '-'}`,
        `- Berat Badan: ${beratBadan || '-'}`,
        `- Lingkar Kepala: ${lingkarKepala || 'Tidak dicatat'}`,
        `- Pemeriksaan Daya Lihat (Penglihatan): ${penglihatan || 'Normal'}`,
        `- Pemeriksaan Daya Dengar (Pendengaran): ${pendengaran || 'Normal'}`,
        `- Perkembangan Motorik Kasar & Halus: ${motorik || 'Sesuai tahapan usia'}`,
        `- Perkembangan Bahasa, Kognitif & Sosial-Emosional: ${bahasaSosial || 'Sesuai tahapan usia'}`,
        catatanTambahan
          ? `- Catatan Tambahan Guru: ${catatanTambahan}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Anda adalah guru PAUD profesional dan tenaga pendidik anak usia dini di Indonesia. Tugas Anda menulis paragraf narasi "Deteksi Dini Tumbuh Kembang Anak (DDTK)" untuk rapor PAUD Kurikulum Merdeka Fase Fondasi. Gunakan bahasa Indonesia baku yang hangat, objektif, santun, dan suportif kepada orang tua. Sebut anak dengan "Ananda [Nama Panggilan]". Rangkum kondisi pertumbuhan fisik (tinggi badan, berat badan, lingkar kepala jika ada), fungsi penglihatan dan pendengaran, perkembangan motorik serta bahasa/sosial-emosional, dan berikan saran stimulasi singkat di rumah bila diperlukan. Tulis dalam 1 paragraf utuh sepanjang 3 hingga 5 kalimat tanpa bullet list, tanpa markdown, dan tanpa judul pembuka.',
        },
      });

      const narrative = (response.text || '').trim();
      if (!narrative) {
        res.status(502).json({
          error: 'Model tidak menghasilkan teks narasi DDTK. Silakan coba lagi.',
        });
        return;
      }

      res.json({ narrative });
    } catch (err: unknown) {
      const { status, message } = extractReadableAiError(
        err,
        'Terjadi kesalahan saat menghubungi layanan AI.'
      );
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/activity/generate', async (req, res) => {
    try {
      const {
        category,
        namaLengkap,
        namaPanggilan,
        kelas,
        semester,
        photos,
      } = req.body || {};

      const displayNickname =
        (typeof namaPanggilan === 'string' && namaPanggilan.trim()) ||
        (typeof namaLengkap === 'string' && namaLengkap.trim().split(' ')[0]) ||
        'Anak';

      const validPhotos: Array<{ mimeType: string; data: string; caption?: string }> = [];
      if (Array.isArray(photos)) {
        for (const item of photos) {
          if (item && typeof item.dataUrl === 'string') {
            const match = item.dataUrl.match(
              /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/
            );
            if (match) {
              validPhotos.push({
                mimeType: match[1],
                data: match[2],
                caption: typeof item.caption === 'string' ? item.caption.trim() : '',
              });
            }
          }
        }
      }

      if (validPhotos.length === 0) {
        res.status(400).json({
          error:
            'Unggah minimal 1 foto kegiatan terlebih dahulu agar AI dapat menganalisis foto.',
        });
        return;
      }

      const ai = getGeminiClient();
      const isKokurikuler = category === 'kokurikuler';
      const categoryLabel = isKokurikuler
        ? 'KEGIATAN KOKURIKULER (Projek Penguatan Profil Pelajar Pancasila / P5)'
        : 'KEGIATAN EKSTRAKURIKULER';

      const captionList = validPhotos
        .map((p, idx) =>
          p.caption ? `Foto ${idx + 1}: ${p.caption}` : `Foto ${idx + 1}: (tanpa keterangan teks)`
        )
        .join('\n');

      const prompt = [
        `Amati dengan cermat seluruh foto ${categoryLabel} yang dilampirkan berikut ini.`,
        `Data murid:`,
        `- Nama Panggilan: ${displayNickname}`,
        `- Nama Lengkap: ${namaLengkap || '-'}`,
        `- Kelas / Semester: ${kelas || 'B'} / ${semester || 'I (Gasal)'}`,
        `Keterangan foto dari guru (jika ada):`,
        captionList,
        ``,
        `Susunlah narasi deskripsi rapor PAUD untuk bagian ${categoryLabel} berdasarkan aktivitas nyata, ekspresi, media/alat yang digunakan, serta sikap kerja sama atau antusiasme yang terlihat pada foto-foto tersebut.`,
      ].join('\n');

      const parts = [
        ...validPhotos.map((p) => ({
          inlineData: {
            mimeType: p.mimeType,
            data: p.data,
          },
        })),
        { text: prompt },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Anda adalah guru PAUD berpengalaman di Indonesia. Tugas Anda menganalisis foto-foto kegiatan anak usia dini lalu menuliskan narasi resmi untuk rapor PAUD Fase Fondasi. Sebut anak dengan "Ananda [Nama Panggilan]". Jelaskan jenis kegiatan yang tampak pada foto, keterlibatan atau antusiasme anak, alat/media yang digunakan, serta nilai karakter atau keterampilan yang berkembang (seperti kemandirian, kreativitas, motorik, atau kerja sama). Tulis dalam bahasa Indonesia yang hangat, apresiatif, objektif, dan rapi dalam 1 paragraf utuh (3 sampai 5 kalimat), tanpa bullet list, tanpa markdown, dan tanpa judul pembuka.',
        },
      });

      const narrative = (response.text || '').trim();
      if (!narrative) {
        res.status(502).json({
          error: 'Model tidak menghasilkan narasi dari foto. Silakan coba lagi.',
        });
        return;
      }

      res.json({ narrative });
    } catch (err: unknown) {
      const { status, message } = extractReadableAiError(
        err,
        'Terjadi kesalahan saat menganalisis foto dengan AI.'
      );
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/refleksi-guru/generate', async (req, res) => {
    try {
      const {
        namaLengkap,
        namaPanggilan,
        kelas,
        semester,
        elemenAgama,
        elemenJatiDiri,
        elemenLiterasi,
      } = req.body || {};

      const displayNickname =
        (typeof namaPanggilan === 'string' && namaPanggilan.trim()) ||
        (typeof namaLengkap === 'string' && namaLengkap.trim().split(' ')[0]) ||
        'Anak';

      const ai = getGeminiClient();

      const prompt = [
        `Susun catatan "REFLEKSI GURU" untuk rapor PAUD TK Sinar Dunia berdasarkan rangkuman 3 Elemen Capaian Pembelajaran murid berikut:`,
        `- Nama Panggilan: ${displayNickname}`,
        `- Nama Lengkap: ${namaLengkap || '-'}`,
        `- Kelas / Semester: ${kelas || 'B'} / ${semester || 'I (Gasal)'}`,
        ``,
        `1. Elemen Nilai Agama dan Budi Pekerti:`,
        elemenAgama || '-',
        ``,
        `2. Elemen Jati Diri:`,
        elemenJatiDiri || '-',
        ``,
        `3. Elemen Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni:`,
        elemenLiterasi || '-',
        ``,
        `Rangkum perkembangan utama Ananda ${displayNickname} dari ketiga elemen tersebut, lalu berikan saran yang hangat dan membangun untuk anak serta saran pendampingan praktis bagi orang tua di rumah.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Anda adalah guru kelas PAUD Kurikulum Merdeka Fase Fondasi di Indonesia. Tugas Anda menulis bagian "REFLEKSI GURU" pada rapor anak usia dini. Rangkum capaian menonjol dan aspek yang masih terus distimulasi dari ketiga elemen capaian pembelajaran (Nilai Agama & Budi Pekerti, Jati Diri, serta Dasar-dasar Literasi & STEAM). Sertakan pula saran penyemangat untuk Ananda dan saran konkret yang mudah dilakukan orang tua di rumah. Gunakan bahasa Indonesia baku yang hangat, positif, empatik, dan mudah dipahami orang tua. Sebut anak dengan "Ananda [Nama Panggilan]". Tulis dalam 1 hingga 2 paragraf mengalir tanpa bullet list, tanpa markdown, dan tanpa judul pembuka.',
        },
      });

      const narrative = (response.text || '').trim();
      if (!narrative) {
        res.status(502).json({
          error: 'Model tidak menghasilkan refleksi guru. Silakan coba lagi.',
        });
        return;
      }

      res.json({ narrative });
    } catch (err: unknown) {
      const { status, message } = extractReadableAiError(
        err,
        'Terjadi kesalahan saat menyusun refleksi guru dengan AI.'
      );
      res.status(status).json({ error: message });
    }
  });

  // Pastikan setiap request ke /api/* yang tidak cocok selalu mengembalikan JSON (bukan HTML 404)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
  });

  // Tangani error body-parser (mis. payload foto terlalu besar / JSON rusak) sebagai JSON
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (!req.path.startsWith('/api')) {
        next(err);
        return;
      }
      const typedErr = err as { status?: number; type?: string; message?: string };
      if (typedErr?.type === 'entity.too.large' || typedErr?.status === 413) {
        res.status(413).json({
          error:
            'Ukuran foto yang dikirim terlalu besar. Kurangi jumlah foto atau gunakan file berukuran lebih kecil.',
        });
        return;
      }
      if (typedErr?.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Format body permintaan JSON tidak valid.' });
        return;
      }
      res.status(typedErr?.status || 500).json({
        error: typedErr?.message || 'Terjadi kesalahan internal pada server.',
      });
    }
  );

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer();
