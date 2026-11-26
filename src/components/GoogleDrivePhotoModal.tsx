import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  LogOut,
  Search,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  downloadDriveImageBlob,
  getCurrentDriveUser,
  getDriveAccessToken,
  initDriveAuth,
  listDriveImages,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  type DriveImageFile,
} from '../services/googleDriveAuth';

interface GoogleDrivePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImageBlob: (blob: Blob, filename: string) => Promise<void>;
}

export const GoogleDrivePhotoModal: React.FC<GoogleDrivePhotoModalProps> = ({
  isOpen,
  onClose,
  onSelectImageBlob,
}) => {
  const [user, setUser] = useState<User | null>(getCurrentDriveUser());
  const [token, setToken] = useState<string | null>(getDriveAccessToken());
  const [authLoading, setAuthLoading] = useState(false);

  const [files, setFiles] = useState<DriveImageFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
      },
      () => {
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadFiles = async (
    accessToken: string,
    query: string,
    append = false,
    pageToken?: string
  ) => {
    setLoadingFiles(true);
    setError(null);
    try {
      const res = await listDriveImages(accessToken, query, pageToken);
      setFiles((prev) => (append ? [...prev, ...res.files] : res.files));
      setNextPageToken(res.nextPageToken);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memuat foto dari Google Drive.';
      setError(msg);
      if (msg.includes('berakhir')) {
        setToken(null);
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      loadFiles(token, searchQuery, false);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      const res = await signInWithGoogleDrive();
      setUser(res.user);
      setToken(res.accessToken);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan akun Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setUser(null);
    setToken(null);
    setFiles([]);
  };

  const handlePickFile = async (file: DriveImageFile) => {
    if (!token) return;
    setDownloadingId(file.id);
    setError(null);
    try {
      const blob = await downloadDriveImageBlob(token, file.id);
      await onSelectImageBlob(blob, file.name);
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengambil foto dari Google Drive.';
      setError(msg);
      if (msg.includes('berakhir')) {
        setToken(null);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pilih Foto dari Google Drive"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pilih Foto dari Google Drive
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ambil foto anak atau dokumentasi kegiatan langsung dari Google
              Drive Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}

          {!token ? (
            <div className="py-10 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div className="max-w-sm space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Masuk ke Akun Google Anda
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Untuk menelusuri dan memilih gambar dari Google Drive, silakan
                  masuk terlebih dahulu dengan akun Google Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
                className="inline-flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 shadow-xs disabled:opacity-60 transition-colors"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-sky-700" />
                ) : (
                  <svg
                    viewBox="0 0 48 48"
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <>
              {/* Account & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (token) loadFiles(token, searchQuery, false);
                  }}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama file foto di Google Drive..."
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingFiles}
                    className="rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors"
                  >
                    Cari
                  </button>
                </form>

                <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
                  <span className="truncate max-w-[160px]">
                    {user?.email || 'Terhubung'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </button>
                </div>
              </div>

              {/* Files Grid */}
              {loadingFiles && files.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-700" />
                  <span className="text-xs">Memuat daftar foto dari Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl">
                  Tidak ditemukan file gambar di Google Drive yang sesuai.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((file) => {
                      const isDownloading = downloadingId === file.id;
                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => handlePickFile(file)}
                          disabled={Boolean(downloadingId)}
                          className="group relative rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-sky-600 hover:shadow-xs transition-all flex flex-col gap-2 disabled:opacity-60"
                        >
                          <div className="w-full h-28 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden relative">
                            {file.thumbnailLink ? (
                              <img
                                src={file.thumbnailLink}
                                alt={file.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-7 h-7 text-slate-400" />
                            )}
                            {isDownloading && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-sky-700" />
                              </div>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-slate-800 truncate w-full group-hover:text-sky-800">
                            {file.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {nextPageToken && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          loadFiles(token, searchQuery, true, nextPageToken)
                        }
                        disabled={loadingFiles}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {loadingFiles ? 'Memuat...' : 'Muat Lebih Banyak'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
