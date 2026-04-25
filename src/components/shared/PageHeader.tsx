import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export default function PageHeader({ title, subtitle, actions, breadcrumb }: Props) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 text-xs">/</span>}
                {b.href ? (
                  <a href={b.href} className="text-xs text-slate-400 hover:text-sky-600 transition-colors">{b.label}</a>
                ) : (
                  <span className="text-xs text-slate-500">{b.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
