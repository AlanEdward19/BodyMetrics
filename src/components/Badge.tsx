import './Badge.css';
import type { LucideIcon } from 'lucide-react';

interface BadgeProps {
  icon?: LucideIcon;
  label: string;
  value: string;
}

export function Badge({ icon: Icon, label, value }: BadgeProps) {
  return (
    <div className="badge">
      {Icon && <Icon className="badge-icon" size={20} strokeWidth={1.5} />}
      <div className="badge-content">
        <span className="badge-label">{label}</span>
        <span className="badge-value">{value}</span>
      </div>
    </div>
  );
}
