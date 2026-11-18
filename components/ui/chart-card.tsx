interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`min-w-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm ${className}`}>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="truncate text-xs text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
