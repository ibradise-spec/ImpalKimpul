import { useCallback, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside.js';

export default function RowMenu({ label, actions }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const close = useCallback(() => setPos(null), []);
  useClickOutside(ref, close, pos !== null);

  function toggle(event) {
    if (pos) {
      close();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
  }

  return (
    <div className="row-menu" ref={ref}>
      <button type="button" className="row-menu-btn" aria-label={label} aria-expanded={pos !== null} onClick={toggle}>
        <Ellipsis size={18} />
      </button>
      {pos && (
        <div className="menu" role="menu" style={{ top: pos.top, right: pos.right }}>
          {actions.map((action) =>
            action.href ? (
              <a key={action.label} role="menuitem" href={action.href} target="_blank" rel="noreferrer" onClick={close}>
                {action.icon}
                {action.label}
              </a>
            ) : (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={action.danger ? 'menu-danger' : ''}
                onClick={() => {
                  close();
                  action.onClick();
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
