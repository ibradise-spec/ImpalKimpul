import { Check } from 'lucide-react';

export default function Chip({ checked, onClick, children }) {
  return (
    <button
      type="button"
      className={`chip ${checked ? 'chip-checked' : ''}`}
      aria-pressed={checked}
      onClick={onClick}
    >
      <span className="chip-radio">{checked && <Check size={12} strokeWidth={3} />}</span>
      {children}
    </button>
  );
}
