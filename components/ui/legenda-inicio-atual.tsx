export function LegendaInicioAtual() {
  return (
    <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-azul" />
        Início
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-verde-claro" />
        Atual
      </span>
    </div>
  );
}
