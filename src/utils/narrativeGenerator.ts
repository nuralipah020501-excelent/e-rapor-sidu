import type { CpDefinition, ElementBank, Predicate } from '../types/rapor';

const PREDICATE_SCORE: Record<Predicate, number> = {
  BB: 1,
  MB: 2,
  BSH: 3,
  BSB: 4,
};

const SCORE_PREDICATE: Record<number, Predicate> = {
  1: 'BB',
  2: 'MB',
  3: 'BSH',
  4: 'BSB',
};

/**
 * Replaces [Nama] placeholder cleanly with the student's nickname (or fallback).
 * Avoids awkward double "Ananda Ananda" if the nickname itself starts with "Ananda".
 */
export function applyStudentName(template: string, nickname: string): string {
  const cleanName = nickname.trim() || '...';
  let result = template.replace(/\[Nama\]/gi, cleanName);
  result = result.replace(/\bAnanda\s+Ananda\b/gi, 'Ananda');
  return result;
}

/**
 * Combines opening template + selected indicator sentences + closing template
 * into a cohesive, flowing Indonesian paragraph.
 */
export function generateElementNarrative(
  bank: ElementBank,
  indicatorPredicates: Record<string, Predicate>,
  nickname: string
): string {
  const parts: string[] = [];

  if (bank.openingTemplate.trim()) {
    parts.push(applyStudentName(bank.openingTemplate.trim(), nickname));
  }

  for (const ind of bank.indicators) {
    const pred: Predicate = indicatorPredicates[ind.id] || 'BSH';
    const rawSentence = ind.texts[pred] || ind.texts.BSH || '';
    if (rawSentence.trim()) {
      parts.push(applyStudentName(rawSentence.trim(), nickname));
    }
  }

  if (bank.closingTemplate.trim()) {
    parts.push(applyStudentName(bank.closingTemplate.trim(), nickname));
  }

  return parts.join(' ');
}

/**
 * Computes the effective predicate for an official CP row in the table.
 * Uses explicit override if set; otherwise averages mapped indicators.
 */
export function getCpPredicate(
  cp: CpDefinition,
  indicatorPredicates: Record<string, Predicate>,
  cpOverrides: Record<string, Predicate | undefined>
): Predicate {
  const override = cpOverrides[cp.id];
  if (override) return override;

  if (!cp.mappedIndicatorIds.length) return 'BSH';

  const total = cp.mappedIndicatorIds.reduce((sum, id) => {
    const pred = indicatorPredicates[id] || 'BSH';
    return sum + PREDICATE_SCORE[pred];
  }, 0);

  const avg = Math.round(total / cp.mappedIndicatorIds.length);
  const clamped = Math.max(1, Math.min(4, avg));
  return SCORE_PREDICATE[clamped] || 'BSH';
}

/**
 * Compresses and resizes an uploaded image file in the browser so that
 * multiple high-res photos fit comfortably inside localStorage while staying
 * crisp for A4/F4 printing.
 */
export function compressImageFile(
  file: Blob,
  options: { maxWidth?: number; maxHeight?: number; preservePng?: boolean; quality?: number } = {}
): Promise<string> {
  const {
    maxWidth = 960,
    maxHeight = 960,
    preservePng = false,
    quality = 0.84,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        if (!preservePng) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mime =
          preservePng && file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const output = canvas.toDataURL(mime, quality);
        resolve(output);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function extractImageFileFromClipboardData(
  clipboardData: DataTransfer | null
): File | null {
  if (!clipboardData) return null;
  const items = Array.from(clipboardData.items || []);
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  const files = Array.from(clipboardData.files || []);
  for (const f of files) {
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}

export async function readImageBlobFromClipboard(): Promise<Blob> {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
    throw new Error(
      'Browser tidak mendukung tombol tempel langsung. Silakan klik kotak foto lalu tekan Ctrl+V (atau Cmd+V).'
    );
  }
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const imageType = item.types.find((t) => t.startsWith('image/'));
    if (imageType) {
      return await item.getType(imageType);
    }
  }
  throw new Error(
    'Tidak ada gambar di clipboard. Salin (Copy) gambar terlebih dahulu, lalu coba tempel lagi.'
  );
}

