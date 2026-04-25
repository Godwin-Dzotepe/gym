import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="w-6 h-6" />
      </div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc mt-1">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href} className="btn-primary text-sm">{action.label}</Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary text-sm">{action.label}</button>
          )}
        </div>
      )}
    </div>
  );
}
