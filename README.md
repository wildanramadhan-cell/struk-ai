<div align="center">

# StrukAI

**AI-Powered Personal Expense Tracker & Automated Receipt Scanner**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-LLM_Inference-F55036?style=for-the-badge)](https://groq.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

[Live Demo](https://struk-ai-p9vp.vercel.app/) · [Report Bug](https://github.com/wildanramadhan-cell/struk-ai/issues) · [Request Feature](https://github.com/wildanramadhan-cell/struk-ai/issues)

</div>

---

## Overview

**StrukAI** is a dark-themed, full-stack financial tracking application designed to eliminate manual expense logging. By uploading a photo of a physical cashier receipt, a QRIS payment screenshot, a bank transfer proof, or an online food delivery invoice (GoFood/ShopeeFood), StrukAI automatically extracts the merchant name, itemized purchases, transaction date, and grand total—then categorizes the expense in seconds.

Built with a **1-Click Demo Mode**, visitors and recruiters can explore the full Bento Grid dashboard, pre-seeded transactions, and live AI receipt scanner immediately without creating an account.

---

## Key Features

- **1-Click Recruiter Demo Mode:** Instant access to a pre-populated sandbox (`demo@recruiter.app`) with realistic transactions, interactive charts, and full scanner capabilities.
- **Hybrid AI Receipt Scanner:** Combines client-side **Tesseract.js OCR** with **Groq LLM structured parsing** to read Indonesian receipts, fix OCR character typos, and output validated JSON.
- **Interactive Quick-Verify Workflow:** Features a real-time laser-scanning preview followed by an editable verification modal where users can adjust items, quantities, categories, or notes before saving.
- **Bento Grid Analytics Dashboard:**
  - Total expenditure summary with average transaction calculation.
  - Automated AI financial insight card highlighting top spending categories and peak transactions.
  - Interactive category distribution donut chart powered by **Recharts**.
  - Real-time search and multi-category filtering (`Makan & Minum`, `Transportasi`, `Belanja`, `Tagihan & Utilitas`, `Hiburan`, `Lainnya`).
- **Cloud Receipt Archiving:** Original receipt images are securely uploaded to **Supabase Storage** and linked directly to each transaction record.
- **Full Authentication & RLS:** Supports personal account registration/login via **Supabase Auth** protected by PostgreSQL Row-Level Security (RLS) policies.

---

## System Architecture (Hybrid OCR + LLM Pipeline)

To achieve low-latency extraction without hitting server payload limits, receipt processing follows a four-stage pipeline:

1. **Client-Side Optical Character Recognition:** `Tesseract.js` extracts raw text directly in the user's browser from uploaded images (`JPG`, `PNG`, `WEBP`).
2. **Next.js Server Action:** The extracted text is securely passed to `scanReceiptAction` on the server, keeping API credentials hidden from the client.
3. **Structured AI Normalization:** **Groq API** (`openai/gpt-oss-120b` with automatic model fallback) cleans OCR noise, infers the spending category, formats dates (`YYYY-MM-DD`), and returns strict JSON.
4. **Persistence & Storage:** Verified transactions are written to **Supabase PostgreSQL**, while original receipt images are stored in a dedicated **Supabase Storage** bucket.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, Turbopack) |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Data Visualization** | Recharts |
| **OCR & AI Inference** | Tesseract.js (Client OCR), Groq API (Structured JSON Parsing) |
| **Database & Backend** | Supabase (PostgreSQL, Auth, Storage, Row-Level Security) |
| **Deployment** | Vercel |

---

## Project Structure

```text
src/
├── app/
│   ├── actions/
│   │   ├── auth.js            # Login, registration, sign-out & 1-Click Demo Mode actions
│   │   ├── expenses.js        # CRUD operations, demo data seeding & Supabase Storage upload
│   │   └── scan-receipt.js    # Server Action for Groq AI receipt text parsing
│   ├── globals.css            # Tailwind CSS v4 configuration & custom dark theme styles
│   ├── layout.js              # Root layout & metadata
│   └── page.js                # Entry point routing between Auth screen & Dashboard
├── components/
│   ├── AuthScreen.jsx         # Split-screen landing page with 1-Click Demo & Auth tabs
│   ├── DashboardClient.jsx    # Bento Grid dashboard, Recharts analytics & transaction list
│   └── ReceiptScannerModal.jsx# 3-step scanner modal (Upload -> Laser Scan -> Quick-Verify)
└── lib/
    └── supabase/
        ├── admin.js           # Service-role Supabase client for Demo Mode operations
        ├── client.js          # Browser Supabase client
        └── server.js          # SSR cookie-aware Supabase client
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- A **Supabase** project (PostgreSQL database + `receipts` storage bucket)
- A **Groq Cloud** API key (`gsk_...`)

### 1. Clone the Repository

```bash
git clone [https://github.com/wildanramadhan-cell/struk-ai.git](https://github.com/wildanramadhan-cell/struk-ai.git)
cd struk-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=gsk_your_groq_api_key
```

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL of your Supabase project (`https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon/publishable key from Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key used server-side for Demo Mode seeding |
| `GROQ_API_KEY` | API key from [Groq Console](https://console.groq.com/keys) for receipt structuring |

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## License

This project is open-source and available under the [MIT License](LICENSE).