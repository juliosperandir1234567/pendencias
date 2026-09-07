type Accent = "verde" | "azul" | "muted";

const ACCENT_TEXT: Record<Accent, string> = {
  verde: "text-brand-verde",
  azul: "text-brand-azul",
  muted: "text-gray-500",
};

const ACCENT_BADGE: Record<Accent, string> = {
  verde: "bg-brand-verde text-white",
  azul: "bg-brand-azul text-white",
  muted: "bg-gray-400 text-white",
};

interface KpiCardProps {
  label: string;
  value: string;
  accent?: Accent;
  hint?: string;
  icon?: React.ReactNode;
}

export function KpiCard({
  label,
  value,
  accent = "verde",
  hint,
  icon,
}: KpiCardProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
      {icon && (
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${ACCENT_BADGE[accent]}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 text-[9px] font-medium uppercase leading-tight tracking-wide text-gray-500">
          {label}
        </p>
        <p className={`text-base font-bold leading-tight ${ACCENT_TEXT[accent]}`}>
          {value}
        </p>
        {hint && <p className="truncate text-[10px] text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}
