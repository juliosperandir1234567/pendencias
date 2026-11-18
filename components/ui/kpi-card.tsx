type Accent = "verde" | "azul" | "muted" | "ambar" | "vermelho";

const ACCENT_TEXT: Record<Accent, string> = {
  verde: "text-brand-verde",
  azul: "text-brand-azul",
  muted: "text-gray-500",
  ambar: "text-amber-600",
  vermelho: "text-red-600",
};

const ACCENT_BADGE: Record<Accent, string> = {
  verde: "bg-brand-verde text-white",
  azul: "bg-brand-azul text-white",
  muted: "bg-gray-400 text-white",
  ambar: "bg-amber-500 text-white",
  vermelho: "bg-red-500 text-white",
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      {icon && (
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${ACCENT_BADGE[accent]}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 text-[11px] font-medium uppercase leading-tight tracking-wide text-gray-500">
          {label}
        </p>
        <p className={`text-2xl font-bold leading-tight ${ACCENT_TEXT[accent]}`}>
          {value}
        </p>
        {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}
