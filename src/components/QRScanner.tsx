"use client";

import { useRef, useState } from "react";
import { Camera, Link, RefreshCw } from "lucide-react";

export interface QRResult {
  accessKey: string;
  totalAmount?: number;
  rawUrl: string;
}

export function parseQRData(url: string): QRResult | null {
  try {
    const parsed = new URL(url);
    let accessKey = "";
    let totalAmount: number | undefined;

    const p = parsed.searchParams.get("p");
    if (p) {
      const fields = decodeURIComponent(p).split("|");
      const ak = fields[0]?.replace(/\D/g, "");
      if (ak && ak.length === 44) {
        accessKey = ak;
        for (const idx of [4, 3]) {
          const raw = fields[idx];
          if (raw && raw.trim()) {
            const total = parseFloat(raw.replace(",", "."));
            if (!isNaN(total) && total > 0) {
              totalAmount = total;
              break;
            }
          }
        }
      }
    }

    if (!accessKey) {
      const chave = parsed.searchParams.get("chaveNFe");
      if (chave) {
        const ak = chave.replace(/\D/g, "");
        if (ak.length === 44) accessKey = ak;
      }
    }

    if (!accessKey) return null;

    return { accessKey, totalAmount, rawUrl: url };
  } catch {
    return null;
  }
}

async function decodeQR(img: HTMLImageElement): Promise<string | null> {
  if ("BarcodeDetector" in window) {
    try {
      const bitmap = await createImageBitmap(img);
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const barcodes = await detector.detect(bitmap);
      bitmap.close();
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch { /* fallback */ }
  }

  try {
    const { default: jsQR } = await import("jsqr");
    const bitmap = await createImageBitmap(img);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // 1. Otimização: Tenta ler recortando a área central (onde as pessoas alinham o QR code)
    // Isso evita distorção/borrão de downsampling em imagens gigantes tiradas pelo celular
    if (bitmap.width > 800 && bitmap.height > 800) {
      const cropSize = Math.round(Math.min(bitmap.width, bitmap.height) * 0.65);
      const cropX = Math.round((bitmap.width - cropSize) / 2);
      const cropY = Math.round((bitmap.height - cropSize) / 2);
      
      canvas.width = cropSize;
      canvas.height = cropSize;
      ctx.drawImage(bitmap, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
      
      const imageData = ctx.getImageData(0, 0, cropSize, cropSize);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        bitmap.close();
        return code.data;
      }
    }

    // 2. Fallback: Escala a imagem completa em múltiplas dimensões
    for (const maxDim of [1200, 800, 1600]) {
      const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
      const sw = Math.round(bitmap.width * scale);
      const sh = Math.round(bitmap.height * scale);
      if (sw === 0 || sh === 0) continue;
      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(bitmap, 0, 0, sw, sh);
      const imageData = ctx.getImageData(0, 0, sw, sh);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) { bitmap.close(); return code.data; }
    }
    bitmap.close();
  } catch { /* jsQR unavailable */ }

  return null;
}

export function QRScanner({ onScan }: { onScan: (data: QRResult) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "failed" | "done">("idle");
  const [manualUrl, setManualUrl] = useState("");
  const [showManual, setShowManual] = useState(false);

  async function processImage(file: File) {
    setStatus("processing");

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setPreview(dataUrl);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    try {
      const raw = await decodeQR(img);
      if (raw) {
        const result = parseQRData(raw);
        if (result) {
          setStatus("done");
          onScan(result);
          return;
        }
      }
      setStatus("failed");
    } catch {
      setStatus("failed");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    await processImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRetake() {
    setPreview(null);
    setStatus("idle");
    setScanning(false);
    fileInputRef.current?.click();
  }

  function handleManualSubmit() {
    const result = parseQRData(manualUrl);
    if (result) {
      onScan(result);
      setManualUrl("");
      setShowManual(false);
    } else {
      alert("URL inválida. Cole o link completo do QR Code.");
    }
  }

  // Se tem preview e está em estado final, mostra resultado
  if (preview && (status === "failed" || status === "done")) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-zinc-700">
          <img src={preview} alt="QR capturado" className="object-cover w-full h-full" />
          {status === "failed" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-sm font-bold text-red-400 mb-1">QR Code não encontrado</p>
                <p className="text-[10px] text-zinc-400">Enquadre bem o código e evite reflexos</p>
              </div>
            </div>
          )}
          {status === "done" && (
            <div className="absolute top-2 right-2 bg-emerald-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              OK
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRetake}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={scanning}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-all w-full disabled:opacity-50"
      >
        {scanning ? (
          <>
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-blue-400">Processando...</span>
          </>
        ) : (
          <>
            <Camera className="h-8 w-8 text-blue-500" />
            <span className="text-xs font-medium">Fotografar QR Code</span>
          </>
        )}
      </button>

      <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
        Abre a câmera em resolução total. Enquadre o QR Code da nota e tire a foto.
      </p>

      <button
        onClick={() => setShowManual(!showManual)}
        className="flex items-center justify-center gap-2 w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Link className="h-3 w-3" />
        {showManual ? "Cancelar" : "Inserir link do QR Code manualmente"}
      </button>

      {showManual && (
        <div className="flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://example.com?p=..."
            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
