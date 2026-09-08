"use client";

import { useRef, useState, useTransition } from "react";
import { importarNr, type ResultadoImportacaoNr } from "../actions";
import { formatNumber, formatPercent } from "@/lib/format";

export function FormularioImportacaoNr({ totalAtual }: { totalAtual: number }) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoImportacaoNr | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function enviar(forcar: boolean) {
    if (!arquivo) return;
    const formData = new FormData();
    formData.set("arquivo", arquivo);
    formData.set("forcar", forcar ? "true" : "false");
    startTransition(async () => {
      const res = await importarNr(formData);
      setResultado(res);
      if (res.ok) {
        setArquivo(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Atualmente há {formatNumber(totalAtual)} registros de NR cadastrados.
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Arquivo (.xlsx)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            setArquivo(e.target.files?.[0] ?? null);
            setResultado(null);
          }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-verde file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-verde-claro"
        />
      </div>

      <button
        type="button"
        disabled={!arquivo || isPending}
        onClick={() => enviar(false)}
        className="w-full rounded-lg bg-brand-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-verde-claro disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isPending ? "Importando…" : "Importar Espelho de NR's"}
      </button>

      {resultado?.avisoQueda && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Queda muito grande de registros</p>
          <p className="mt-1">
            O banco tem {formatNumber(resultado.avisoQueda.atual)} registros e o
            arquivo enviado só traz {formatNumber(resultado.avisoQueda.novo)}{" "}
            (queda de {formatPercent(resultado.avisoQueda.percentualQueda)}). Isso
            pode indicar um arquivo incompleto ou errado. Confira antes de
            continuar.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => enviar(true)}
            className="mt-3 rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            Importar mesmo assim
          </button>
        </div>
      )}

      {resultado?.erro && !resultado.avisoQueda && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {resultado.erro}
        </p>
      )}

      {resultado?.ok && resultado.resumo && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">Importação concluída</p>
          <ul className="mt-1 space-y-0.5">
            <li>{formatNumber(resultado.resumo.treinamentos)} treinamento(s) novo(s) no catálogo</li>
            <li>{formatNumber(resultado.resumo.registros)} registro(s) sincronizado(s)</li>
            {resultado.resumo.erros > 0 && (
              <li className="text-amber-700">
                {formatNumber(resultado.resumo.erros)} linha(s) ignorada(s) por
                erro — veja o histórico de importações.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
