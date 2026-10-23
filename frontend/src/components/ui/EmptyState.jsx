// src/components/ui/EmptyState.jsx
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data yet', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Inbox size={28} />
      </div>
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  );
}
