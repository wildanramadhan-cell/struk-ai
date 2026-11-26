import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'StrukAI — Smart AI Expense Tracker',
  description: 'Catat pengeluaran otomatis dari foto struk belanja & QRIS menggunakan Gemini AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark">
      <body className={`${jakarta.className} bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200`}>
        {children}
      </body>
    </html>
  );
}