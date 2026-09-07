interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="truncate text-xs text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
