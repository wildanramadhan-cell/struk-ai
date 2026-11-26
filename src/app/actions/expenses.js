'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// UUID khusus untuk akun Demo Mode agar rekruter bisa langsung mencoba tanpa daftar
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

// Helper menentukan user aktif (User Login asli atau Akun Demo)
export async function getActiveUser() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { id: user.id, email: user.email, isDemo: false };
  }

  if (isDemo) {
    return { id: DEMO_USER_ID, email: 'demo@recruiter.app', isDemo: true };
  }

  return null;
}

// Mengaktifkan atau menonaktifkan Demo Mode
export async function setDemoModeAction(enable) {
  const cookieStore = await cookies();
  if (enable) {
    cookieStore.set('demo_mode', 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // Berlaku 24 jam
    });
    await ensureDemoDataExists();
  } else {
    cookieStore.delete('demo_mode');
  }
  revalidatePath('/');
}

// Mengisi data contoh realistis jika akun Demo masih kosong
async function ensureDemoDataExists() {
  const { count } = await supabaseAdmin
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', DEMO_USER_ID);

  if (count && count > 0) return;

  const now = new Date();
  const formatDate = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const sampleExpenses = [
    {
      user_id: DEMO_USER_ID,
      merchant: 'Kopi Kenangan - Sudirman',
      amount: 48000,
      category: 'Makan & Minum',
      transaction_date: formatDate(0),
      items: [
        { name: 'Kopi Kenangan Mantan (L)', qty: 1, price: 28000 },
        { name: 'Roti Cokelat Klasik', qty: 1, price: 20000 },
      ],
      notes: 'Ngopi sore sambil kerja via QRIS',
    },
    {
      user_id: DEMO_USER_ID,
      merchant: 'Indomaret Point',
      amount: 86500,
      category: 'Belanja',
      transaction_date: formatDate(1),
      items: [
        { name: 'Air Mineral 1.5L', qty: 2, price: 14000 },
        { name: 'Sabun Mandi Cair', qty: 1, price: 42500 },
        { name: 'Snack Kentang', qty: 2, price: 30000 },
      ],
      notes: 'Belanja kebutuhan harian bulanan',
    },
    {
      user_id: DEMO_USER_ID,
      merchant: 'GoRide - Commute Kantor',
      amount: 34000,
      category: 'Transportasi',
      transaction_date: formatDate(2),
      items: [{ name: 'Perjalanan GoRide 8.4 km', qty: 1, price: 34000 }],
      notes: 'Transportasi berangkat kerja pagi',
    },
    {
      user_id: DEMO_USER_ID,
      merchant: 'PLN Token Listrik',
      amount: 202500,
      category: 'Tagihan & Utilitas',
      transaction_date: formatDate(4),
      items: [{ name: 'Token Listrik Prabayar 200rb', qty: 1, price: 202500 }],
      notes: 'Isi ulang token listrik apartemen',
    },
    {
      user_id: DEMO_USER_ID,
      merchant: 'XXI Cinema - Premier',
      amount: 120000,
      category: 'Hiburan',
      transaction_date: formatDate(5),
      items: [
        { name: 'Tiket Nonton Weekend', qty: 2, price: 100000 },
        { name: 'Mineral Water', qty: 1, price: 20000 },
      ],
      notes: 'Nonton bioskop akhir pekan',
    },
    {
      user_id: DEMO_USER_ID,
      merchant: 'Sate Khas Senayan',
      amount: 165000,
      category: 'Makan & Minum',
      transaction_date: formatDate(6),
      items: [
        { name: 'Sate Ayam Bumbu Kacang', qty: 1, price: 85000 },
        { name: 'Nasi Putih & Es Teh Manis', qty: 2, price: 80000 },
      ],
      notes: 'Makan malam bersama tim',
    },
  ];

  await supabaseAdmin.from('expenses').insert(sampleExpenses);
}

// Mengambil semua daftar pengeluaran user aktif
export async function getExpensesAction() {
  const user = await getActiveUser();
  if (!user) return [];

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch expenses error:', error.message || error.code || JSON.stringify(error));
    return [];
  }

  return data || [];
}

// Menyimpan transaksi hasil scan AI + upload foto struk ke Storage
export async function saveExpenseAction(formData) {
  try {
    const user = await getActiveUser();
    if (!user) {
      return { success: false, error: 'Sesi berakhir, silakan login ulang.' };
    }

    const merchant = formData.get('merchant');
    const amount = Number(formData.get('amount'));
    const category = formData.get('category');
    const transaction_date = formData.get('transaction_date');
    const notes = formData.get('notes') || '';
    const itemsRaw = formData.get('items');
    const items = itemsRaw ? JSON.parse(itemsRaw) : [];
    const file = formData.get('receipt');

    let receipt_url = null;

    // Upload foto struk jika ada
    if (file && typeof file !== 'string' && file.size > 0) {
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('receipts')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('receipts')
          .getPublicUrl(fileName);
        receipt_url = publicUrlData.publicUrl;
      }
    }

    const { error: insertError } = await supabaseAdmin.from('expenses').insert({
      user_id: user.id,
      merchant,
      amount,
      category,
      transaction_date,
      items,
      notes,
      receipt_url,
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: 'Gagal menyimpan data ke database.' };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('Save expense error:', err);
    return { success: false, error: 'Terjadi kesalahan saat menyimpan.' };
  }
}

// Menghapus transaksi
export async function deleteExpenseAction(id) {
  try {
    const user = await getActiveUser();
    if (!user) return { success: false };

    await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false };
  }
}