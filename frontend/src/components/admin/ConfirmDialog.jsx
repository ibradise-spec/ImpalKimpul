import { useState } from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, confirmLabel = 'Ya', danger = false, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <p className="dialog-message">{message}</p>
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Batal
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={run} disabled={busy}>
          {busy ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
