import { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, Upload, Camera, X, ExternalLink } from 'lucide-react';
import jsQR from 'jsqr';
import PageHeader from '../components/PageHeader';
import { useAuditMode } from '../utils/auditMode';
import { useLanguage } from '../i18n';

type Mode = 'upload' | 'camera';

export default function QrScannerPage() {
  const [auditMode] = useAuditMode();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('upload');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const scanFrameLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrameLoop);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code) {
      setResult(code.data);
      stopCamera();
    } else {
      rafRef.current = requestAnimationFrame(scanFrameLoop);
    }
  }, [stopCamera]);

  async function startCamera() {
    setError('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraActive(true);
        rafRef.current = requestAnimationFrame(scanFrameLoop);
      }
    } catch {
      setError(t('cameraUnavailable'));
    }
  }

  function decodeImageFile(file: File) {
    setError('');
    setResult(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code) {
        setResult(code.data);
      } else {
        setError(t('qrNotFound'));
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError(t('imageReadFailed'));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) decodeImageFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) decodeImageFile(file);
  }

  function handleReset() {
    setResult(null);
    setError('');
    stopCamera();
  }

  const isUrl = result ? /^https?:\/\//i.test(result) : false;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<QrCode className="w-5 h-5 text-brand" />}
        title={t('qrTitle')}
        description={t('qrDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Mode tabs */}
        <div className="flex gap-2 bg-surface border border-line rounded-xl p-1">
          {(['upload', 'camera'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setError(''); stopCamera(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-brand text-white shadow'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {m === 'upload' ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {m === 'upload' ? t('uploadImage') : t('cameraScan')}
            </button>
          ))}
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 transition-all ${
              dragOver
                ? 'border-brand bg-brand-soft'
                : 'border-line-strong hover:border-line-strong hover:bg-sunken'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-sunken flex items-center justify-center">
              <QrCode className="w-7 h-7 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-ink-2 font-medium text-sm">{t('dropImage')}</p>
              <p className="text-faint text-xs mt-1">{t('qrImageHint')}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-surface border border-line aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                playsInline
                muted
              />
              {!cameraActive && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Camera className="w-10 h-10 text-faint" />
                  <p className="text-muted text-sm">{t('cameraNotStarted')}</p>
                </div>
              )}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-brand rounded-xl shadow-lg " />
                </div>
              )}
            </div>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
              >
                <Camera className="w-4 h-4" />
                {t('startCamera')}
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="w-full flex items-center justify-center gap-2 bg-sunken hover:bg-line border border-line-strong text-ink-2 font-medium py-3.5 rounded-xl transition-all text-sm"
              >
                <X className="w-4 h-4" />
                {t('stopCamera')}
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-2">{t('qrContent')}</p>
              <button onClick={handleReset} className="text-xs text-muted hover:text-ink-2 transition-colors">
                {t('scanAnother')}
              </button>
            </div>

            <div className={`rounded-xl border p-4 space-y-3 ${
              isUrl ? 'bg-amber-50 border-amber-200' : 'bg-surface border-line'
            }`}>
              <p className="text-sm font-mono break-all text-ink">{result}</p>

              {isUrl && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {t('urlDetected')}
                  </div>
                  {!auditMode && <button
                    onClick={() => window.dispatchEvent(new CustomEvent('qr-scan-url', { detail: result }))}
                    className="flex items-center justify-center gap-1.5 text-xs text-brand hover:text-brand-strong border border-brand/30 hover:border-brand/60 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {t('scanWithVt')} →
                  </button>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
