'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import {
  X,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { scanReceiptAction } from '@/app/actions/scan-receipt';
import { saveExpenseAction } from '@/app/actions/expenses';

const CATEGORIES = [
  'Makan & Minum',
  'Transportasi',
  'Belanja',
  'Tagihan & Utilitas',
  'Hiburan',
  'Lainnya',
];

export default function ReceiptScannerModal({ isOpen, onClose, onSaved }) {
  const fileInputRef = useRef(null);

  // Tahapan: 'upload' | 'scanning' | 'verify'
  const [step, setStep] = useState('upload');
  const [scanStatus, setScanStatus] = useState('Membaca teks pada struk...');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // State Form Verifikasi
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan & Minum');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  const resetModal = () => {
    setStep('upload');
    setScanStatus('Membaca teks pada struk...');
    setFile(null);
    setPreviewUrl(null);
    setError('');
    setIsSaving(false);
    setMerchant('');
    setAmount('');
    setCategory('Makan & Minum');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Mohon unggah file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('scanning');
    setScanStatus('Membaca teks pada struk...');

    try {
      // 1. Ekstrak teks mentah dari foto struk menggunakan Tesseract OCR di browser
      const worker = await createWorker('eng');
      const {
        data: { text: ocrText },
      } = await worker.recognize(selectedFile);
      await worker.terminate();

      if (!ocrText || ocrText.trim().length < 5) {
        setError(
          'Teks pada foto struk tidak terbaca. Pastikan foto terang dan tidak buram.'
        );
        setStep('upload');
        return;
      }

      // 2. Kirim teks hasil OCR ke Groq AI untuk dirapikan menjadi JSON
      setScanStatus('AI merapikan item & nominal...');
      const formData = new FormData();
      formData.append('ocrText', ocrText);

      const result = await scanReceiptAction(formData);

      if (!result.success) {
        setError(result.error || 'Gagal memproses gambar.');
        setStep('upload');
        return;
      }

      const data = result.data;
      setMerchant(data.merchant || '');
      setAmount(String(data.amount || ''));
      setCategory(
        CATEGORIES.includes(data.category) ? data.category : 'Lainnya'
      );
      setTransactionDate(
        data.transaction_date || new Date().toISOString().split('T')[0]
      );
      setNotes(data.notes || '');
      setItems(Array.isArray(data.items) ? data.items : []);
      setStep('verify');
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat memindai struk. Pastikan koneksi internet aktif.');
      setStep('upload');
    }
  };

  const handleManualEntry = () => {
    setFile(null);
    setPreviewUrl(null);
    setError('');
    setMerchant('');
    setAmount('');
    setCategory('Makan & Minum');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
    setStep('verify');
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value : Number(value || 0),
    };
    setItems(updated);
  };

  const addNewItem = () => {
    setItems([...items, { name: '', qty: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) {
      setError('Nama merchant dan total nominal wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('merchant', merchant.trim());
      formData.append('amount', amount);
      formData.append('category', category);
      formData.append('transaction_date', transactionDate);
      formData.append('notes', notes.trim());
      formData.append(
        'items',
        JSON.stringify(items.filter((item) => item.name.trim() !== ''))
      );
      if (file) {
        formData.append('receipt', file);
      }

      const res = await saveExpenseAction(formData);
      if (!res.success) {
        setError(res.error || 'Gagal menyimpan transaksi.');
        setIsSaving(false);
        return;
      }

      resetModal();
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan transaksi.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">
                  {step === 'upload' && 'Scan Struk & Bukti Bayar'}
                  {step === 'scanning' && 'AI Sedang Membaca Struk...'}
                  {step === 'verify' && 'Verifikasi Data Transaksi'}
                </h3>
                <p className="text-xs text-slate-400">
                  Didukung oleh Hybrid OCR & Groq AI
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="p-6 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  handleFileChange(droppedFile);
                }}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-950/50 hover:bg-emerald-500/5 rounded-2xl p-8 text-center cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 flex items-center justify-center mb-4 transition">
                  <UploadCloud className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Klik untuk unggah atau seret foto struk ke sini
                </p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                  Bisa membaca struk kasir (Indomaret, kafe, restoran), screenshot
                  QRIS, GoFood/ShopeeFood, maupun bukti transfer bank.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Tidak ada foto struk saat ini?
                </span>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Input Manual Tanpa Foto
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANIMASI LASER SCANNING */}
          {step === 'scanning' && (
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="relative w-64 h-80 rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-lg shadow-emerald-500/10">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview Struk"
                    className="w-full h-full object-cover opacity-75"
                  />
                )}
                {/* Efek Garis Laser Bergerak */}
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '96%', '0%'] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_4px_rgba(16,185,129,0.8)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 text-xs font-medium text-emerald-300 bg-slate-900/90 border border-emerald-500/30 py-2 px-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  {scanStatus}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: QUICK-VERIFY FORM */}
          {step === 'verify' && (
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {previewUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-200">
                    AI berhasil mengekstrak data struk! Periksa kembali detail di
                    bawah sebelum disimpan.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Preview Gambar Kiri (Jika ada) */}
                {previewUrl && (
                  <div className="md:col-span-4">
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[3/4] relative">
                      <img
                        src={previewUrl}
                        alt="Struk Terunggah"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Form Input Kanan */}
                <div
                  className={`${
                    previewUrl ? 'md:col-span-8' : 'md:col-span-12'
                  } space-y-4`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Nama Toko / Merchant *
                      </label>
                      <input
                        type="text"
                        required
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        placeholder="Contoh: Kopi Kenangan"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Total Nominal (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="45000"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Kategori
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Tanggal Transaksi
                      </label>
                      <input
                        type="date"
                        required
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Rincian Item Terdeteksi */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                        Rincian Item ({items.length})
                      </label>
                      <button
                        type="button"
                        onClick={addNewItem}
                        className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Item
                      </button>
                    </div>

                    {items.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(idx, 'name', e.target.value)
                              }
                              placeholder="Nama item"
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                            />
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(idx, 'qty', e.target.value)
                              }
                              className="w-14 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 text-center"
                            />
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(idx, 'price', e.target.value)
                              }
                              placeholder="Harga"
                              className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Catatan AI / Keterangan
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan singkat transaksi..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Tombol Simpan */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Scan Ulang
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan Transaksi
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}