import PageHero from '../components/PageHero.jsx';
import { REMINDER_TEXT } from '../config.js';

const steps = [
  'Cari barangmu di katalog memakai kolom pencarian, filter kategori, atau filter warna.',
  'Buka detail barang yang cocok, lalu catat kode barangnya.',
  `Datang ke lokasi pengambilan di Logistik kampus. ${REMINDER_TEXT}.`,
  'Petugas Logistik mencocokkan barang fisik dan KTM kamu.',
  'Jika sudah sesuai, barang diserahkan dan status di katalog berubah menjadi sudah diambil.',
];

export default function ManualBookPage() {
  return (
    <>
      <PageHero title="Manual Book" subtitle="Panduan singkat mencari dan mengambil barang yang hilang." />
      <section className="section">
        <ol className="steps">
          {steps.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      </section>
    </>
  );
}
