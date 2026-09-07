"use client";

import { useRef, useState, useTransition } from "react";
import {
  uploadLoginBg,
  removerLoginBg,
  type ResultadoLogo,
} from "../actions";

export function FormularioLoginBg({
  bgAtual,
}: {
  bgAtual: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoLogo | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function enviar() {
    if (!arquivo) return;
    const formData = new FormData();
    formData.set("arquivo", arquivo);
    startTransition(async () => {
      const res = await uploadLoginBg(formData);
      setResultado(res);
      if (res.ok) {
        setArquivo(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function remover() {
    if (!confirm("Remover a imagem de fundo do login?")) return;
    startTransition(async () => {
      const res = await removerLoginBg();
      setResultado(res);
    });
  }

  const mostrarPreview = preview ?? bgAtual;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Fundo atual
        </label>
        <div className="flex h-24 w-full max-w-xs items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {mostrarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mostrarPreview}
              alt="Prévia do fundo de login"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-gray-400">Sem imagem (fundo padrão cinza)</span>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Nova imagem (PNG, JPG, SVG ou WEBP — até 5MB)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setArquivo(f);
            setResultado(null);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-verde file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-verde-claro"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!arquivo || isPending}
          onClick={enviar}
          className="flex-1 rounded-lg bg-brand-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-verde-claro disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isPending ? "Enviando…" : "Salvar Fundo"}
        </button>
        {bgAtual && (
          <button
            type="button"
            disabled={isPending}
            onClick={remover}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Remover
          </button>
        )}
      </div>

      {resultado?.erro && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {resultado.erro}
        </p>
      )}

      {resultado?.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Fundo do login atualizado.
        </p>
      )}
    </div>
  );
}
