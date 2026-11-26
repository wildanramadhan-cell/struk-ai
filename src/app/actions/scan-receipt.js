'use server';

export async function scanReceiptAction(formData) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || !apiKey.startsWith('gsk_')) {
      return {
        success: false,
        error: 'GROQ_API_KEY di file .env.local belum diisi atau tidak valid.',
      };
    }

    const ocrText = formData.get('ocrText');
    if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length < 5) {
      return {
        success: false,
        error: 'Teks pada foto struk tidak terbaca. Pastikan foto terang dan tidak buram.',
      };
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `Kamu adalah asisten keuangan pintar yang ahli merapikan hasil bacaan OCR struk belanja Indonesia, bukti transfer bank, screenshot QRIS, GoFood, GrabFood, dan ShopeeFood.
Perbaiki typo akibat pembacaan OCR (misalnya angka 0 terbaca O atau sebaliknya) dan ekstrak informasi dari teks struk berikut menjadi JSON valid.

TEKS HASIL OCR STRUK:
"""
${ocrText.slice(0, 4000)}
"""

Kembalikan HANYA format JSON valid persis seperti struktur ini:
{
  "merchant": "Nama toko, restoran, atau penerima pembayaran (contoh: Indomaret, Kopi Kenangan, GoFood - Ayam Geprek)",
  "amount": 45500,
  "category": "Makan & Minum",
  "transaction_date": "${today}",
  "items": [
    { "name": "Nama item", "qty": 1, "price": 45500 }
  ],
  "notes": "Ringkasan singkat 1 kalimat dalam Bahasa Indonesia"
}

Aturan wajib:
1. "amount": Angka murni (number) total akhir yang dibayarkan tanpa titik/koma/Rp. Ambil nilai Grand Total / Total Bayar setelah diskon/pajak.
2. "category": Pilih SATU yang paling cocok dari daftar persis ini: "Makan & Minum", "Transportasi", "Belanja", "Tagihan & Utilitas", "Hiburan", "Lainnya".
3. "transaction_date": Format YYYY-MM-DD. Jika tahun tidak tercantum di struk, gunakan tahun saat ini. Jika tanggal tidak terbaca sama sekali, gunakan "${today}".
4. "items": Array daftar barang/produk yang dibeli. Jika struk transfer/QRIS tidak mencantumkan rincian barang, isi 1 item dengan nama transaksi utamanya.`;

    const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let rawContent = null;
    let lastError = '';

    for (const modelId of models) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      });

      const result = await response.json();

      if (response.ok && result.choices?.[0]?.message?.content) {
        rawContent = result.choices[0].message.content;
        break;
      }

      lastError = result?.error?.message || `HTTP Error ${response.status}`;
    }

    if (!rawContent) {
      throw new Error(lastError || 'Gagal memproses teks struk dengan Groq AI.');
    }

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format respons AI bukan JSON yang valid.');
    }

    const rawData = JSON.parse(jsonMatch[0]);

    const parsedData = {
      merchant: rawData.merchant || 'Transaksi Struk',
      amount: Number(rawData.amount) || 0,
      category: rawData.category || 'Lainnya',
      transaction_date: rawData.transaction_date || today,
      items: Array.isArray(rawData.items) ? rawData.items : [],
      notes: rawData.notes || '',
    };

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    console.error('OCR Parse Error:', error);
    return {
      success: false,
      error: `Gagal membaca struk: ${error?.message || 'Terjadi kesalahan pada AI.'}`,
    };
  }
}