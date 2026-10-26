import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronUp, ClipboardList, Mail, MessageCircle, Signpost } from 'lucide-react';
import Brand from './Brand.jsx';
import { helpdesk } from '../config.js';

function HelpLink({ href, icon, label, missingHint }) {
  if (!href) {
    return (
      <span className="nav-sub disabled" title={missingHint}>
        {icon}
        {label}
      </span>
    );
  }
  return (
    <a className="nav-sub" href={href} target="_blank" rel="noreferrer">
      {icon}
      {label}
    </a>
  );
}

export default function Sidebar() {
  const [helpOpen, setHelpOpen] = useState(false);
  const waHref = helpdesk.whatsapp ? `https://wa.me/${helpdesk.whatsapp}` : '';
  const mailHref = helpdesk.email ? `mailto:${helpdesk.email}` : '';

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="nav" aria-label="Menu utama">
        <NavLink to="/" end className="nav-item">
          <ClipboardList size={20} />
          Catalog Lost Item
        </NavLink>
        <NavLink to="/pos-location" className="nav-item">
          <Signpost size={20} />
          Pos Location
        </NavLink>
        <NavLink to="/manual-book" className="nav-item">
          <BookOpen size={20} />
          Manual Book
        </NavLink>
        <button
          type="button"
          className="nav-item nav-button"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((open) => !open)}
        >
          <Mail size={20} />
          <span className="grow">Helpdesk</span>
          {helpOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {helpOpen && (
          <div className="nav-subgroup">
            <HelpLink
              href={waHref}
              icon={<MessageCircle size={18} />}
              label="Whatsapp"
              missingHint="Nomor WhatsApp belum diatur"
            />
            <HelpLink
              href={mailHref}
              icon={<Mail size={18} />}
              label="Email"
              missingHint="Email helpdesk belum diatur"
            />
          </div>
        )}
      </nav>
    </aside>
  );
}
