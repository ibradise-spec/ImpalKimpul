# LostNFound Frontend

React + Vite. Butuh Node 20 atau lebih baru.

```
npm install
npm run dev
```

Buka http://localhost:5173. Backend harus jalan di http://localhost:3000
(`docker compose up` dari root repo). Request ke `/api` dan `/uploads`
otomatis di-proxy ke backend oleh Vite.

Opsional, salin `.env.example` jadi `.env`:

- `VITE_API_URL`: kosongkan saat development (pakai proxy). Isi dengan URL backend saat deploy.
- `VITE_HELPDESK_WA`: nomor WhatsApp helpdesk, format 628xxxxxxxxxx.
- `VITE_HELPDESK_EMAIL`: email helpdesk.

Tes: `npm run test`. Build produksi: `npm run build`.
