import { useState } from 'react';
import { ImagePlus } from 'lucide-react';

export default function Dropzone({ previewUrl, onFile, inputId }) {
  const [active, setActive] = useState(false);

  function onDrop(event) {
    event.preventDefault();
    setActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      htmlFor={inputId}
      className={`dropzone ${active ? 'dropzone-active' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Pratinjau foto barang" />
      ) : (
        <span className="dropzone-hint">
          <ImagePlus size={44} aria-hidden="true" />
          <strong>Photo to Analyze / Drag-and-Drop</strong>
          <small>Klik atau tarik foto ke sini. JPG, PNG, atau WEBP, maksimal 5 MB.</small>
        </span>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Foto barang"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}
