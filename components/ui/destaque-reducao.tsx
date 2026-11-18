import { formatNumber, formatPercent } from "@/lib/format";

/** Card principal: quanto as pendências caíram (ou subiram) desde o início. */
export function DestaqueReducao({
  inicio,
  atual,
  className = "",
}: {
  inicio: number;
  atual: number;
  className?: string;
}) {
  const base = `rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className}`;

  if (inicio <= 0) {
    return (
      <div className={base}>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Pendências atuais
        </p>
        <p className="text-3xl font-bold text-brand-verde">{formatNumber(atual)}</p>
        <p className="mt-1 text-xs text-gray-400">Marco de início não definido</p>
      </div>
    );
  }

  const variacao = ((atual - inicio) / inicio) * 100;
  const caiu = variacao <= 0;
  const restante = Math.min(atual / inicio, 1) * 100;

  return (
    <div className={base}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Pendências desde o início
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-4xl font-bold leading-none ${caiu ? "text-brand-verde" : "text-red-600"}`}
        >
          {caiu ? "↓ " : "↑ "}
          {formatPercent(Math.abs(variacao))}
        </span>
        <span className="text-sm text-gray-600">
          de <strong className="text-gray-900">{formatNumber(inicio)}</strong> para{" "}
          <strong className="text-gray-900">{formatNumber(atual)}</strong>
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
        <div
          className={`h-full rounded-full ${caiu ? "bg-brand-verde" : "bg-red-600"}`}
          style={{ width: `${restante}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {caiu
          ? `${formatNumber(inicio - atual)} pendências a menos que no início`
          : `${formatNumber(atual - inicio)} pendências a mais que no início`}
      </p>
    </div>
  );
}
