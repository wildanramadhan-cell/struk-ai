'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Camera,
  PieChart,
  ShieldCheck,
  Play,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { setDemoModeAction } from '@/app/actions/expenses';

export default function AuthView() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    try {
      await setDemoModeAction(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Gagal memuat mode demo. Silakan coba lagi.');
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const supabase = createClient();

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError('Email atau password salah. Pastikan akun sudah terdaftar.');
          setLoading(false);
          return;
        }

        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message || 'Gagal mendaftarkan akun.');
          setLoading(false);
          return;
        }

        if (data?.session) {
          router.refresh();
        } else {
          setInfoMessage(
            'Akun berhasil dibuat! Cek inbox email untuk verifikasi, atau gunakan tombol Demo Mode untuk langsung masuk.'
          );
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi gangguan koneksi. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden px-4 py-12">
      {/* Dekorasi Cahaya Latar */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Kolom Kiri: Value Proposition & Highlight Fitur */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Gemini 2.5 Flash Vision</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Catat Keuangan Cukup dari{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Foto Struk.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Unggah foto struk kasir, screenshot QRIS, atau bukti pesan antar
              makanan. AI otomatis mengekstrak nominal, daftar item, dan
              mengelompokkan kategori pengeluaranmu dalam hitungan detik.
            </p>
          </div>

          {/* 3 Mini Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1.5">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-100">
                AI Receipt OCR
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Baca struk fisik maupun screenshot e-wallet secara instan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1.5">
              <PieChart className="w-5 h-5 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-100">
                Smart Analytics
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Visualisasi kategori & ringkasan insight kebiasaan belanja.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              <h3 className="text-xs font-semibold text-slate-100">
                Cloud Storage
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Arsip foto struk asli tersimpan rapi dan aman di cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kartu Login & 1-Click Demo */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-white">
                  Struk<span className="text-emerald-400">AI</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Portfolio App</span>
            </div>

            {/* Tombol Unggulan: 1-Click Demo Mode */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300">
                  Ingin langsung mencoba tanpa daftar?
                </span>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyiapkan Data Demo...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    Coba Akun Demo (1-Klik)
                  </>
                )}
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
                atau akun pribadi
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Tab Switcher Login / Daftar */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setInfoMessage('');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'register'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-white disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun Baru'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}