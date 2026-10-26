import { useState } from 'react';
import { handoverItem } from '../../api/admin.js';
import Modal from './Modal.jsx';

export default function HandoverModal({ item, onClose, onDone }) {
  const [takerName, setTakerName] = useState('');
  const [takerNim, setTakerNim] = useState('');
  const [ktmVerified, setKtmVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!takerName.trim() || !takerNim.trim()) {
      setError('Nama dan NIM pengambil wajib diisi');
      return;
    }
    setBusy(true);
    try {
      await handoverItem(item.id, { takerName: takerName.trim(), takerNim: takerNim.trim(), ktmVerified });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Tandai Barang Diambil" onClose={onClose}>
      <p className="dialog-message">
        <strong>{item.name}</strong> ({item.code}) akan ditandai sudah diambil.
      </p>
      <form onSubmit={onSubmit} className="form-stack">
        <div className="field">
          <label htmlFor="taker-name">Nama Pengambil</label>
          <input id="taker-name" value={takerName} onChange={(e) => setTakerName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="taker-nim">NIM Pengambil</label>
          <input id="taker-nim" value={takerNim} onChange={(e) => setTakerNim(e.target.value)} />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={ktmVerified} onChange={(e) => setKtmVerified(e.target.checked)} />
          Saya sudah memverifikasi KTM pengambil
        </label>
        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !ktmVerified}>
            {busy ? 'Menyimpan...' : 'Simpan Serah Terima'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
