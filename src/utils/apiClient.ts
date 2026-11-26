export interface ApiErrorShape {
  error?: string;
  message?: string;
}

export function safeParseJson<T = unknown>(
  rawText: string
): { ok: true; data: T } | { ok: false } {
  if (!rawText || !rawText.trim()) {
    return { ok: false };
  }
  try {
    return { ok: true, data: JSON.parse(rawText) as T };
  } catch {
    return { ok: false };
  }
}

export async function safeFetchJson<T extends object>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(
      networkErr instanceof Error && networkErr.message
        ? `Gagal terhubung ke server (${networkErr.message}).`
        : 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
    );
  }

  const rawText = await response.text();
  const parsed = safeParseJson<T & ApiErrorShape>(rawText);

  if (!response.ok) {
    if (parsed.ok) {
      const serverMsg =
        (typeof parsed.data.error === 'string' && parsed.data.error.trim()) ||
        (typeof parsed.data.message === 'string' && parsed.data.message.trim());
      if (serverMsg) {
        throw new Error(serverMsg);
      }
    }

    const preview = rawText.replace(/\s+/g, ' ').trim().slice(0, 120);
    if (
      response.status === 404 ||
      /the page could not be found|cannot (get|post)|not found/i.test(preview)
    ) {
      throw new Error(
        `Endpoint layanan (${url}) tidak ditemukan atau server backend belum berjalan (HTTP ${response.status}).`
      );
    }
    if (response.status === 413) {
      throw new Error(
        'Ukuran data/foto yang dikirim terlalu besar. Gunakan foto dengan ukuran lebih kecil.'
      );
    }

    throw new Error(
      `Permintaan ke server gagal (HTTP ${response.status})${
        preview ? `: ${preview}` : '.'
      }`
    );
  }

  if (!parsed.ok) {
    const preview = rawText.replace(/\s+/g, ' ').trim().slice(0, 120);
    throw new Error(
      `Server mengembalikan respons bukan JSON dari ${url}${
        preview ? ` (${preview})` : '.'
      }`
    );
  }

  return parsed.data;
}
