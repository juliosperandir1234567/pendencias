"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  multiple = false,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  function toggle(optionValue: string) {
    if (multiple) {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(value[0] === optionValue ? [] : [optionValue]);
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:border-brand-verde-claro focus:border-brand-verde-claro focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span
          className={
            selectedLabels.length
              ? "truncate text-gray-800"
              : "truncate text-gray-400"
          }
        >
          {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-brand-verde-claro"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            {multiple && value.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-brand-azul hover:bg-gray-50"
                >
                  Limpar seleção
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-gray-400">Nenhum resultado</li>
            )}
            {filtered.map((option) => {
              const selected = value.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-emerald-50 ${
                      selected
                        ? "bg-emerald-50 font-medium text-brand-verde"
                        : "text-gray-700"
                    }`}
                  >
                    {multiple && (
                      <span
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-brand-verde-claro bg-brand-verde-claro text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && (
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
