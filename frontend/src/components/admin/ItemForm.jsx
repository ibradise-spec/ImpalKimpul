import { useEffect, useId, useRef, useState } from 'react';
import { analyzePhoto } from '../../api/admin.js';
import { toLocalInput } from '../../utils/format.js';
import AiStatus from './AiStatus.jsx';
import Dropzone from './Dropzone.jsx';
import '../../ai-status.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export default function ItemForm({
  categories,
  colors,
  initial = null,
  requirePhoto = false,
  submitLabel = 'Upload',
  onSubmit,
  onCancel,
}) {
  const uid = useId();
  const autofill = !initial;
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initial?.photoUrl || '');
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [categoryId, setCategoryId] = useState(initial ? String(initial.category.id) : '');
  const [subcategoryId, setSubcategoryId] = useState(initial?.subcategory ? String(initial.subcategory.id) : '');
  const [colorId, setColorId] = useState(initial?.color ? String(initial.color.id) : '');
  const [foundAt, setFoundAt] = useState(initial ? toLocalInput(initial.foundAt) : '');
  const [foundLocation, setFoundLocation] = useState(initial?.foundLocation || '');
  const [aiConfidence, setAiConfidence] = useState(null);
  const [ai, setAi] = useState({ status: 'idle' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const touched = useRef({});
  const requestId = useRef(0);

  useEffect(() => {
    if (!photo || typeof URL.createObjectURL !== 'function') return undefined;
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => {
      if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    };
  }, [photo]);

  const subOptions = categories.find((c) => String(c.id) === categoryId)?.subcategories ?? [];

  function applyDraft(draft) {
    if (!touched.current.name && draft.name) setName(draft.name);
    if (!touched.current.description && draft.description) setDescription(draft.description);
    if (!touched.current.category && draft.categoryId) {
      setCategoryId(String(draft.categoryId));
      if (!touched.current.subcategory) {
        setSubcategoryId(draft.subcategoryId ? String(draft.subcategoryId) : '');
      }
    }
    if (!touched.current.color) {
      setColorId(draft.colorId ? String(draft.colorId) : '');
    }
    setAiConfidence(draft.aiConfidence);
  }

  async function runAnalyze(file) {
    requestId.current += 1;
    const id = requestId.current;
    setAi({ status: 'loading' });
    try {
      const data = new FormData();
      data.append('photo', file);
      const res = await analyzePhoto(data);
      if (id !== requestId.current) return;

      const draft = res.data;
      if (!draft.aiAvailable) {
        setAi({ status: 'unavailable' });
      } else if (!draft.label) {
        setAi({ status: 'none' });
      } else {
        applyDraft(draft);
        setAi({ status: 'done', draft });
      }
    } catch {
      if (id === requestId.current) setAi({ status: 'unavailable' });
    }
  }

  function onPickFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WEBP');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Ukuran foto maksimal 5 MB');
      return;
    }
    setError('');
    setPhoto(file);
    if (autofill) runAnalyze(file);
  }

  function onCategoryChange(value) {
    touched.current.category = true;
    setCategoryId(value);
    setSubcategoryId('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (requirePhoto && !photo) {
      setError('Foto barang wajib diunggah');
      return;
    }
    if (!name.trim()) {
      setError('Nama barang wajib diisi');
      return;
    }
    if (!categoryId) {
      setError('Kategori wajib dipilih');
      return;
    }
    if (!foundLocation.trim()) {
      setError('Lokasi penemuan wajib diisi');
      return;
    }

    const data = new FormData();
    if (photo) data.append('photo', photo);
    data.append('name', name.trim());
    data.append('description', description.trim());
    data.append('categoryId', categoryId);
    data.append('subcategoryId', subcategoryId);
    data.append('colorId', colorId);
    data.append('foundLocation', foundLocation.trim());
    if (foundAt) data.append('foundAt', new Date(foundAt).toISOString());
    if (autofill && aiConfidence != null) data.append('aiConfidence', String(aiConfidence));

    setBusy(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      <div className="item-form-photo">
        <Dropzone inputId={`${uid}-photo`} previewUrl={previewUrl} onFile={onPickFile} />
        {autofill && <AiStatus ai={ai} />}
      </div>

      <div className="item-form-fields">
        <h2 className="form-heading">Item Details</h2>

        <div className="field">
          <label htmlFor={`${uid}-name`}>Nama Barang</label>
          <input
            id={`${uid}-name`}
            value={name}
            placeholder="Nama Barang"
            onChange={(e) => {
              touched.current.name = true;
              setName(e.target.value);
            }}
          />
        </div>

        <div className="field">
          <label htmlFor={`${uid}-desc`}>Deskripsi</label>
          <textarea
            id={`${uid}-desc`}
            rows={3}
            value={description}
            placeholder="Deskripsi"
            onChange={(e) => {
              touched.current.description = true;
              setDescription(e.target.value);
            }}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${uid}-cat`}>Kategori</label>
            <select id={`${uid}-cat`} value={categoryId} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-sub`}>Subkategori</label>
            <select
              id={`${uid}-sub`}
              value={subcategoryId}
              disabled={subOptions.length === 0}
              onChange={(e) => {
                touched.current.subcategory = true;
                setSubcategoryId(e.target.value);
              }}
            >
              <option value="">{subOptions.length ? 'Pilih subkategori' : 'Tidak ada'}</option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${uid}-color`}>Warna</label>
            <select
              id={`${uid}-color`}
              value={colorId}
              onChange={(e) => {
                touched.current.color = true;
                setColorId(e.target.value);
              }}
            >
              <option value="">Tidak ada</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-date`}>Tanggal</label>
            <input
              id={`${uid}-date`}
              type="datetime-local"
              value={foundAt}
              onChange={(e) => setFoundAt(e.target.value)}
            />
            {!initial && <small>Kosongkan untuk memakai waktu saat ini.</small>}
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${uid}-loc`}>Lokasi Penemuan</label>
          <input id={`${uid}-loc`} value={foundLocation} onChange={(e) => setFoundLocation(e.target.value)} />
        </div>

        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan...' : submitLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Batal
          </button>
        </div>
      </div>
    </form>
  );
}
