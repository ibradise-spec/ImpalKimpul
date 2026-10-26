import { ExternalLink, MapPin } from 'lucide-react';
import { fetchPosLocations } from '../api/catalog.js';
import { useApi } from '../hooks/useApi.js';
import PageHero from '../components/PageHero.jsx';

export default function PosLocationPage() {
  const { data, error, loading } = useApi((signal) => fetchPosLocations(signal), []);
  const locations = data?.data ?? [];

  return (
    <>
      <PageHero title="Pos Location" subtitle="Tempat pengambilan barang temuan di Telkom University Surabaya." />
      <section className="section">
        {loading && <p className="notice">Memuat lokasi...</p>}
        {error && <p className="notice notice-error">{error.message}</p>}
        {!loading && !error && locations.length === 0 && <p className="notice">Belum ada lokasi pos.</p>}
        <div className="location-list">
          {locations.map((loc) => (
            <article key={loc.id} className="location-card">
              <MapPin size={24} aria-hidden="true" />
              <div>
                <h3>{loc.name}</h3>
                {loc.description && <p>{loc.description}</p>}
                {loc.mapUrl && (
                  <a href={loc.mapUrl} target="_blank" rel="noreferrer" className="link-inline">
                    Lihat peta <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
