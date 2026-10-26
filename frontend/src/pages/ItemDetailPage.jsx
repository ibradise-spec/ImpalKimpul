import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Info, MapPin } from 'lucide-react';
import { fetchItem } from '../api/catalog.js';
import { REMINDER_TEXT } from '../config.js';
import { useApi } from '../hooks/useApi.js';
import { formatDateTime } from '../utils/format.js';
import Photo from '../components/Photo.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ItemDetailPage() {
  const { id } = useParams();
  const { data, error, loading } = useApi((signal) => fetchItem(id, signal), [id]);

  const back = (
    <Link to="/" className="back-link">
      <ArrowLeft size={18} />
      Kembali ke katalog
    </Link>
  );

  if (loading) {
    return (
      <section className="section">
        {back}
        <div className="detail" aria-busy="true">
          <div className="detail-photo skeleton" />
          <div className="detail-info skeleton" />
        </div>
      </section>
    );
  }

  if (error) {
    const missing = error.status === 404;
    return (
      <section className="section">
        {back}
        <p className="notice notice-error">{missing ? 'Barang tidak ditemukan.' : error.message}</p>
      </section>
    );
  }

  const item = data.data;
  const pickup = item.pickupLocation;

  return (
    <section className="section">
      <h2>Detail Barang</h2>
      {back}

      <div className="detail">
        <div className="detail-photo">
          <Photo src={item.photoUrl} alt={item.name} />
          <StatusBadge status={item.status} />
        </div>

        <div className="detail-info">
          <span className="card-category">
            {item.category.name}
            {item.subcategory ? ` / ${item.subcategory.name}` : ''}
          </span>
          <h3 className="detail-title">{item.name}</h3>
          <p className="detail-code">Kode: {item.code}</p>
          <p className="detail-desc">{item.description || 'Tidak ada deskripsi'}</p>
          <div className="detail-meta">
            <span>
              <MapPin size={18} aria-hidden="true" />
              Ditemukan di: {item.foundLocation}
            </span>
            <span>
              <Clock size={18} aria-hidden="true" />
              {formatDateTime(item.foundAt)}
            </span>
          </div>
        </div>
      </div>

      {item.status === 'taken' && <p className="notice">Barang ini sudah diambil oleh pemiliknya.</p>}

      <div className="pickup">
        <div>
          <h4>Lokasi Pengambilan</h4>
          <p>
            {pickup
              ? `${pickup.name}${pickup.description ? ` - ${pickup.description}` : ''}`
              : 'Hubungi Logistik kampus'}
          </p>
        </div>
        <div>
          <h4>
            <Info size={16} aria-hidden="true" /> Reminder !
          </h4>
          <p>{REMINDER_TEXT}</p>
        </div>
      </div>
    </section>
  );
}
