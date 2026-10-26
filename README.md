# LostNFound (ImpalKimpul)

Struktur:

- `backend/` Express + Prisma + MySQL
- `frontend/` React (UI dari Nayya, taruh di sini)

## Jalanin dengan Docker

```
cp .env.example .env
docker compose up --build
docker compose exec backend npm run db:seed
```

Cek: http://localhost:3000/api/health

## Jalanin lokal (tanpa container backend)

```
docker compose up -d db
cd backend
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Catatan: saat ini skema disinkronkan pakai `prisma db push`. Kalau skema sudah stabil, ganti ke `prisma migrate dev` dan commit folder migrations.
