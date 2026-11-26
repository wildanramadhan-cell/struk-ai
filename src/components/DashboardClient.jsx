'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Wallet,
  Sparkles,
  TrendingUp,
  Search,
  Trash2,
  ExternalLink,
  LogOut,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Layers,
  Receipt,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  deleteExpenseAction,
  setDemoModeAction,
} from '@/app/actions/expenses';
import ExpenseChart from './ExpenseChart';
import ReceiptScannerModal from './ReceiptScannerModal';

const CATEGORIES = [
  'Semua',
  'Makan & Minum',
  'Transportasi',
  'Belanja',
  'Tagihan & Utilitas',
  'Hiburan',
  'Lainnya',
];

const CATEGORY_META = {
  'Makan & Minum': {
    icon: Utensils,
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  Transportasi: {
    icon: Car,
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  Belanja: {
    icon: ShoppingBag,
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  'Tagihan & Utilitas': {
    icon: Zap,
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  Hiburan: {
    icon: Film,
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
  Lainnya: {
    icon: Layers,
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
};

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
};

export default function DashboardClient({ initialExpenses, user }) {
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter transaksi berdasarkan kategori & kata kunci pencarian
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        item.merchant?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [initialExpenses, selectedCategory, searchQuery]);

  // Statistik Utama
  const totalAmount = useMemo(
    () =>
      initialExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [initialExpenses]
  );

  const averageAmount =
    initialExpenses.length > 0 ? totalAmount / initialExpenses.length : 0;

  // Kartu AI Financial Insight Otomatis
  const aiInsight = useMemo(() => {
    if (initialExpenses.length === 0) {
      return 'Belum ada transaksi tercatat. Klik tombol "Scan Struk AI" untuk memindai struk belanja atau bukti QRIS pertamamu.';
    }

    const byCat = {};
    const byMerchant = {};
    initialExpenses.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      byCat[exp.category] = (byCat[exp.category] || 0) + amt;
      byMerchant[exp.merchant] = (byMerchant[exp.merchant] || 0) + amt;
    });

    const topCategory = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const topMerchant = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0];
    const topCatPct =
      totalAmount > 0 ? Math.round((topCategory[1] / totalAmount) * 100) : 0;

    return `Pengeluaran terbesar kamu berada di kategori "${topCategory[0]}" sebesar ${topCatPct}% (${formatRupiah(
      topCategory[1]
    )}), dengan transaksi tertinggi di ${topMerchant[0]}.`;
  }, [initialExpenses, totalAmount]);

  const handleLogout = async () => {
    if (user?.isDemo) {
      await setDemoModeAction(false);
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.refresh();
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    await deleteExpenseAction(id);
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-slate-100">
                Struk<span className="text-emerald-400">AI</span>
              </span>
              {user?.isDemo && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400">
              {user?.email}
            </span>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Scan Struk AI
            </button>

            <button
              onClick={handleLogout}
              title="Keluar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {user?.isDemo ? 'Keluar Demo' : 'Keluar'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content — Bento Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Row Bento: 3 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Bento Card 1: Total Pengeluaran */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Pengeluaran Tercatat
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="my-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {formatRupiah(totalAmount)}
              </h1>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {initialExpenses.length} transaksi • Rata-rata{' '}
                  <strong className="text-slate-200">
                    {formatRupiah(averageAmount)}
                  </strong>
                </span>
              </p>
            </div>

            {/* AI Financial Insight Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiInsight}
              </p>
            </div>
          </div>

          {/* Bento Card 2: Grafik Distribusi Kategori */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Distribusi Kategori
                </h2>
                <p className="text-xs text-slate-400">
                  Klasifikasi otomatis oleh AI berdasarkan jenis merchant
                </p>
              </div>
            </div>
            <ExpenseChart expenses={initialExpenses} />
          </div>
        </div>

        {/* Bottom Bento Section: Riwayat Transaksi */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Riwayat Transaksi
              </h2>
              <p className="text-xs text-slate-400">
                Menampilkan {filteredExpenses.length} dari{' '}
                {initialExpenses.length} catatan pengeluaran
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merchant atau catatan..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Daftar Kartu Transaksi */}
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">
                Tidak ada transaksi ditemukan
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Coba ubah filter kategori atau pindai struk baru sekarang.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredExpenses.map((expense) => {
                const meta =
                  CATEGORY_META[expense.category] || CATEGORY_META.Lainnya;
                const IconComponent = meta.icon;
                const itemList = Array.isArray(expense.items)
                  ? expense.items
                  : [];

                return (
                  <div
                    key={expense.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${meta.badge}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">
                            {expense.merchant}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${meta.badge}`}
                          >
                            {expense.category}
                          </span>
                        </div>

                        {expense.notes && (
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {expense.notes}
                          </p>
                        )}

                        {/* Tag Rincian Item */}
                        {itemList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {itemList.slice(0, 3).map((it, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400"
                              >
                                {it.qty}x {it.name}
                              </span>
                            ))}
                            {itemList.length > 3 && (
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-[11px] text-slate-500">
                                +{itemList.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nominal & Aksi Kanan */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 shrink-0">
                      <div className="sm:text-right">
                        <p className="text-sm font-bold text-slate-100">
                          {formatRupiah(expense.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {expense.transaction_date}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {expense.receipt_url && (
                          <button
                            onClick={() =>
                              setPreviewReceiptUrl(expense.receipt_url)
                            }
                            title="Lihat Foto Struk"
                            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          title="Hapus Transaksi"
                          className="p-2 rounded-lg bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Scan Button untuk Mobile */}
      <button
        onClick={() => setIsScannerOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30"
      >
        <Camera className="w-5 h-5" />
        Scan Struk
      </button>

      {/* Modal AI Receipt Scanner */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaved={() => router.refresh()}
      />

      {/* Modal Pratinjau Foto Struk Tersimpan */}
      {previewReceiptUrl && (
        <div
          onClick={() => setPreviewReceiptUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-medium text-slate-300">
                Foto Struk Asli
              </span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-950 max-h-[75vh] overflow-auto flex justify-center">
              <img
                src={previewReceiptUrl}
                alt="Foto Struk"
                className="rounded-xl max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}