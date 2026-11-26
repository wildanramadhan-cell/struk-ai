'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_COLORS = {
  'Makan & Minum': '#10b981',     // Emerald
  'Transportasi': '#3b82f6',      // Blue
  'Belanja': '#8b5cf6',           // Violet
  'Tagihan & Utilitas': '#f59e0b',// Amber
  'Hiburan': '#ec4899',           // Pink
  'Lainnya': '#64748b',           // Slate
};

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function ExpenseChart({ expenses }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kelompokkan total pengeluaran berdasarkan kategori
  const grouped = expenses.reduce((acc, item) => {
    const cat = item.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const data = Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#64748b',
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!mounted) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-500">
        Memuat grafik...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm font-medium text-slate-400">Belum ada data kategori</p>
        <p className="text-xs text-slate-500 mt-1">
          Mulai scan struk pertamamu untuk melihat distribusi pengeluaran.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="w-full sm:w-48 h-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatRupiah(value)}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Rincian Kategori */}
      <div className="w-full space-y-2.5">
        {data.map((item) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-semibold text-slate-100">
                  {formatRupiah(item.value)}
                </span>
                <span className="text-slate-500 w-8 text-right">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}