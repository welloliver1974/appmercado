"use client";

import { useRef, useState } from "react";
import { Camera, Link } from "lucide-react";

interface QRResult {
  accessKey: string;
  totalAmount?: number;
  rawUrl: string;
}

function parseQRData(url: string): QRResult | null {
  try {
    const parsed = new URL(url);
    const p = parsed.searchParams.get("p");
    if (!p) return null;
    const fields = decodeURIComponent(p).split("|");
    const accessKey = fields[0]?.replace(/\D/g, "");
    if (!accessKey || accessKey.length !== 44) return null;
      const result: QRResult = { accessKey, rawUrl: url };
      // Tenta extrair total dos fields (formato NFC-e: chave|versão|tpEmis|cDest|total|...)
      for (const idx of [4, 3]) {
        const raw = fields[idx];
        if (raw && raw.trim()) {
          const total = parseFloat(raw.replace(",", "."));
          if (!isNaN(total) && total > 0) {
            result.totalAmount = total;
            break;
          }
        }
      }
    return result;
  } catch {
    return null;
  }
}

async function decodeQR(img: HTMLImageElement): Promise<string | null> {
  // 1. Tenta BarcodeDetector nativo (Chrome Android, Safari)
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

  // 2. Fallback: jsQR com createImageBitmap (respeita EXIF)
  try {
    const { default: jsQR } = await import("jsqr");
    const bitmap = await createImageBitmap(img);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) return code.data;

    // Tenta com imagem reduzida (QR muito denso em resolução alta)
    const scale = Math.min(1200 / canvas.width, 1200 / canvas.height, 1);
    if (scale < 1) {
      const sw = Math.round(canvas.width * scale);
      const sh = Math.round(canvas.height * scale);
      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(img, 0, 0, sw, sh);
      const smallData = ctx.getImageData(0, 0, sw, sh);
      const smallCode = jsQR(smallData.data, smallData.width, smallData.height);
      if (smallCode) return smallCode.data;
    }
  } catch { /* jsQR unavailable */ }

  return null;
}

export function QRScanner({ onScan }: { onScan: (data: QRResult) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [showManual, setShowManual] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);

    const img = new Image();
    img.onload = async () => {
      try {
        const raw = await decodeQR(img);
        if (raw) {
          const result = parseQRData(raw);
          if (result) {
            onScan(result);
            setScanning(false);
            return;
          }
        }
        alert("QR Code não encontrado. Enquadre bem o código e tire outra foto.");
      } catch {
        alert("Erro ao processar imagem.");
      }
      setScanning(false);
    };
    img.onerror = () => { alert("Erro ao carregar imagem."); setScanning(false); };
    img.src = URL.createObjectURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
