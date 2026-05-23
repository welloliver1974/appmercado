"use client";

import { useState } from "react";
import { Camera, QrCode, ArrowLeft, Loader2, Save, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { processReceiptImage } from "@/lib/ai";
import { saveReceiptAction } from "@/app/actions/receipts";

export default function NovaNota() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setReceiptData(null);
        setSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64 = image.split(",")[1];
      const data = await processReceiptImage(base64);
      if (data?.error) {
        alert(data.message || "Erro ao processar imagem. API não configurada.");
      } else {
        setReceiptData(data);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar imagem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!receiptData) return;
    setSaving(true);
    try {
      await saveReceiptAction(receiptData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar a nota no banco de dados.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="bg-zinc-900 p-12 rounded-3xl border border-zinc-800 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Nota Salva!</h2>
            <p className="text-zinc-400">O estoque e os gastos mensais foram atualizados.</p>
          </div>
          <p className="text-zinc-600 text-sm italic">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-black min-h-screen text-white">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Adicionar Nova Nota</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="font-bold text-lg">Capturar Nota</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 cursor-pointer transition-all">
                <Camera className="h-8 w-8 text-emerald-500" />
                <span className="text-xs font-medium">Tirar Foto</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              </label>
              
              <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition-all opacity-50 cursor-not-allowed">
                <QrCode className="h-8 w-8 text-blue-500" />
                <span className="text-xs font-medium">Ler QR Code</span>
              </button>
            </div>

            {image && (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-zinc-700">
                  <img src={image} alt="Preview" className="object-cover w-full h-full" />
                </div>
                <button 
                  onClick={handleProcessImage}
                  disabled={loading || saving}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Processar com IA"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {receiptData ? (
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-blue-400">Dados Identificados</h3>
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">IA Processed</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase">Mercado</label>
                  <input 
                    type="text"
                    value={receiptData.marketName}
                    onChange={(e) => setReceiptData({...receiptData, marketName: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2 mt-1 text-white font-bold"
                  />
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-4 gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase">Data</label>
                    <input 
                      type="date"
                      value={receiptData.date}
                      onChange={(e) => setReceiptData({...receiptData, date: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-lg p-2 mt-1 text-white text-sm"
                    />
                  </div>
                  <div className="text-right flex-1">
                    <label className="text-xs text-zinc-500 font-bold uppercase">Total</label>
                    <p className="text-xl font-bold text-emerald-400 mt-1">R$ {receiptData.totalAmount?.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase block mb-2">Itens ({receiptData.items?.length})</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {receiptData.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-black border border-zinc-800 text-sm">
                        <div className="flex-1">
                          <p className="font-bold truncate">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.quantity} {item.unit} x R$ {item.unitPrice?.toFixed(2)}</p>
                        </div>
                        <p className="font-bold">R$ {item.totalPrice?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setReceiptData(null)}
                  disabled={saving}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800">
              <div className="p-4 bg-zinc-900 rounded-full mb-4">
                <Loader2 className={`h-8 w-8 text-zinc-700 ${loading ? 'animate-spin' : ''}`} />
              </div>
              <h3 className="font-bold text-zinc-400">Aguardando processamento</h3>
              <p className="text-sm text-zinc-600 mt-2">Suba uma foto da nota fiscal para que a IA possa extrair os dados automaticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
