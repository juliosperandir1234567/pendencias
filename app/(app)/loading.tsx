/** Esqueleto mostrado na hora ao trocar de tela, enquanto os dados carregam. */
export default function Carregando() {
  const bloco = "animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm";
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-80 animate-pulse rounded bg-gray-100" />
      </div>
      <div className={`${bloco} h-16`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className={`${bloco} h-28 sm:col-span-2 lg:col-span-2`} />
        <div className={`${bloco} h-28`} />
        <div className={`${bloco} h-28`} />
        <div className={`${bloco} h-28`} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`${bloco} h-80`} />
        <div className={`${bloco} h-80`} />
      </div>
    </div>
  );
}
