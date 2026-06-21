import { useState, useRef, useCallback, useEffect } from 'react';
import { QrCode, Upload, Camera, X, ExternalLink } from 'lucide-react';
import jsQR from 'jsqr';
import PageHeader from '../components/PageHeader';

type Mode = 'upload' | 'camera';

export default function QrScannerPage() {
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
      setError('Camera access denied or unavailable on this device.');
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
        setError('No QR code found in this image. Try a clearer photo.');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError('Could not read image file.');
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
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<QrCode className="w-5 h-5 text-sky-400" />}
        title="QR Code Scanner"
        description="Decode QR codes from images or your camera — detect phishing links instantly"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Mode tabs */}
        <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['upload', 'camera'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setError(''); stopCamera(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'upload' ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {m === 'upload' ? 'Upload Image' : 'Camera Scan'}
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
                ? 'border-sky-500 bg-sky-500/5'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-900/50'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <QrCode className="w-7 h-7 text-sky-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium text-sm">Drop an image here or tap to browse</p>
              <p className="text-slate-600 text-xs mt-1">PNG, JPG, WebP — screenshot or photo of a QR code</p>
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
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                playsInline
                muted
              />
              {!cameraActive && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Camera className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-500 text-sm">Camera not started</p>
                </div>
              )}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-sky-400/60 rounded-xl shadow-lg shadow-sky-400/10" />
                </div>
              )}
            </div>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3.5 rounded-xl transition-all text-sm"
              >
                <X className="w-4 h-4" />
                Stop Camera
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">QR Code Content</p>
              <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Scan another
              </button>
            </div>

            <div className={`rounded-xl border p-4 space-y-3 ${
              isUrl ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900 border-slate-800'
            }`}>
              <p className="text-sm font-mono break-all text-slate-200">{result}</p>

              {isUrl && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    URL detected — scan before opening
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('qr-scan-url', { detail: result }))}
                    className="flex items-center justify-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Scan URL with VirusTotal →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
