"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import { QrCode, X } from "lucide-react";

interface QRResult {
  accessKey: string;
  totalAmount?: number;
  rawUrl: string;
}

export function QRScanner({ onScan }: { onScan: (data: QRResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  function parseQRData(url: string): QRResult | null {
    try {
      const parsed = new URL(url);
      const p = parsed.searchParams.get("p");
      if (!p) return null;

      const fields = decodeURIComponent(p).split("|");
      const accessKey = fields[0]?.replace(/\D/g, "");
      if (!accessKey || accessKey.length !== 44) return null;

      const result: QRResult = { accessKey, rawUrl: url };

      // Offline contingency (v2.00): fields[3]=day, fields[4]=total
      const version = fields[1];
      const tpEmis = fields[2];
      if (version === "2" && tpEmis === "9") {
        const total = parseFloat(fields[4]?.replace(",", "."));
        if (!isNaN(total)) result.totalAmount = total;
      }

      return result;
    } catch {
      return null;
    }
  }

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
    setScanning(false);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
      setScanning(true);
    } catch {
      alert("Erro ao acessar a câmera.");
    }
  }

  useEffect(() => {
    if (!streaming || !scanning) return;

    function scan() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const result = parseQRData(code.data);
        if (result) {
          stopCamera();
          onScan(result);
          return;
        }
      }

      animRef.current = requestAnimationFrame(scan);
    }

    animRef.current = requestAnimationFrame(scan);

    return () => cancelAnimationFrame(animRef.current);
  }, [streaming, scanning, stopCamera, onScan]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (streaming) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800">
        <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-blue-500 rounded-lg opacity-70" />
        </div>
        <p className="text-center text-xs text-zinc-500 py-2">Aponte para o QR Code da nota</p>
        <button
          onClick={stopCamera}
          className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 pointer-events-auto"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startCamera}
      className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-all"
    >
      <QrCode className="h-8 w-8 text-blue-500" />
      <span className="text-xs font-medium">Ler QR Code</span>
    </button>
  );
}
