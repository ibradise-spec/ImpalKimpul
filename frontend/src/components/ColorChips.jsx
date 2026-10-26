export default function ColorChips({ colors, selected, onToggle }) {
  if (!colors.length) return null;
  return (
    <div className="color-row" role="group" aria-label="Filter warna">
      {colors.map((c) => {
        const active = selected.includes(c.name);
        return (
          <button
            key={c.id}
            type="button"
            className={`color-chip ${active ? 'color-chip-active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(c.name)}
          >
            <span className="color-dot" style={{ background: c.hex }} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
