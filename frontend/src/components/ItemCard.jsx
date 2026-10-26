import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { formatDateTime } from '../utils/format.js';
import Photo from './Photo.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="card">
      <div className="card-photo">
        <Photo src={item.photoUrl} alt={item.name} />
        <StatusBadge status={item.status} />
      </div>
      <div className="card-body">
        <span className="card-category">{item.category.name}</span>
        <h3 className="card-title">{item.name}</h3>
        <p className="card-desc">{item.description || 'Tidak ada deskripsi'}</p>
        <div className="card-meta">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {item.foundLocation}
          </span>
          <span>
            <Clock size={15} aria-hidden="true" />
            {formatDateTime(item.foundAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
