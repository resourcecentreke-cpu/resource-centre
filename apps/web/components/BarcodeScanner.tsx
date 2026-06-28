'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BarcodeScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');

  const start = async () => {
    setErr('');
    const Detector = (window as unknown as { BarcodeDetector?: new (o?: unknown) => { detect: (s: unknown) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) { setErr('Barcode scanning is not supported on this browser.'); return; }
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const detector = new Detector();
      const tick = async () => {
        if (!videoRef.current || !open) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length) {
            stream.getTracks().forEach((t) => t.stop());
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(codes[0].rawValue)}`);
            return;
          }
        } catch { /* keep scanning */ }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch { setErr('Camera permission denied.'); setOpen(false); }
  };

  return (
    <div>
      <button onClick={start} className="px-3 py-1.5 rounded-full text-xs font-bold border border-[#D5DAF0] bg-white">📷 Scan barcode</button>
      {err && <p className="text-xs text-[#E25555] mt-1">{err}</p>}
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <video ref={videoRef} className="max-w-full max-h-[70vh] rounded-2xl" muted playsInline />
        </div>
      )}
    </div>
  );
}
