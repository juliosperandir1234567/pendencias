"use client";

import { useRef, useState, useTransition } from "react";
import { uploadLogo, type ResultadoLogo } from "../actions";

export function FormularioLogo({ logoAtual }: { logoAtual: string | null }) {
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
      const res = await uploadLogo(formData);
      setResultado(res);
      if (res.ok) {
        setArquivo(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Logo atual
        </label>
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Prévia da logo" className="h-full w-full object-contain" />
          ) : logoAtual ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoAtual} alt="Logo atual" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-gray-400">Sem logo</span>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Nova imagem (PNG, JPG, SVG ou WEBP — até 2MB)
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

      <button
        type="button"
        disabled={!arquivo || isPending}
        onClick={enviar}
        className="w-full rounded-lg bg-brand-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-verde-claro disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isPending ? "Enviando…" : "Salvar Logo"}
      </button>

      {resultado?.erro && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {resultado.erro}
        </p>
      )}

      {resultado?.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Logo atualizada com sucesso.
        </p>
      )}
    </div>
  );
}
