"use client";

import { useId } from "react";
import { Minus, Plus, ShieldAlert } from "lucide-react";

/**
 * Small controls shared by the kitchen tools: radio chips in a fieldset, a
 * stepper, a stat tile and calm notices. Scoped `gd-tool-*` classes keep the
 * chosen state readable in dark mode.
 */

export interface ChoiceOption<T extends string> {
  id: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function ChoiceGroup<T extends string>({ legend, options, value, onChange, note, columns, tight }: {
  legend: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  note?: React.ReactNode;
  /** Equal-width grid instead of wrapping chips (e.g. 4 egg sizes). */
  columns?: 2 | 3 | 4;
  /** Keep 3 columns on phones too (short labels such as altitudes). */
  tight?: boolean;
}) {
  const name = useId();
  const layout = columns === 4 ? "grid grid-cols-2 gap-2 min-[480px]:grid-cols-4"
    : columns === 3 ? `grid gap-2 ${tight ? "grid-cols-3" : "grid-cols-1 min-[420px]:grid-cols-3"}`
      : columns === 2 ? "grid grid-cols-2 gap-2"
        : "flex flex-wrap gap-2";
  return (
    <fieldset className="min-w-0">
      <legend className="gd-tool-strong mb-2 text-sm font-semibold">{legend}</legend>
      <div className={layout}>
        {options.map(option => (
          <label key={option.id} className="min-w-0">
            <input type="radio" name={name} value={option.id} checked={value === option.id} disabled={option.disabled}
              onChange={() => onChange(option.id)} className="peer sr-only" />
            <span className={`gd-tool-chip ${columns ? "w-full" : ""} ${columns === 4 || tight ? "items-center text-center" : ""} ${tight ? "!px-1.5 whitespace-nowrap text-[13px] sm:text-sm" : ""}`}>
              <span>{option.label}</span>
              {option.hint && <span className="gd-tool-chip-hint">{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {note && <div className="gd-tool-muted mt-2 text-[13px] leading-relaxed">{note}</div>}
    </fieldset>
  );
}

export function Stepper({ label, value, display, min, max, step, onChange, decreaseLabel, increaseLabel }: {
  label: string; value: number; display: string; min: number; max: number; step: number;
  onChange: (value: number) => void; decreaseLabel: string; increaseLabel: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <span id={id} className="gd-tool-strong mb-2 block text-sm font-semibold">{label}</span>
      <div role="group" aria-labelledby={id} className="gd-tool-tile inline-flex items-center p-1">
        <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}
          className="gd-tool-link grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40">
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <output aria-live="polite" className="gd-tool-strong min-w-[5.5rem] text-center font-heading text-lg font-semibold tabular-nums">{display}</output>
        <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}
          className="gd-tool-link grid h-11 w-11 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40">
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="gd-tool-tile min-w-0 px-4 py-3">
      <span className="gd-tool-muted block text-xs font-medium">{label}</span>
      <span className="gd-tool-strong mt-0.5 block font-heading text-xl font-semibold tabular-nums leading-tight">{value}</span>
      {sub && <span className="gd-tool-muted mt-0.5 block text-xs leading-snug">{sub}</span>}
    </div>
  );
}

export function SafetyNote({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div role="note" className="gd-tool-warn flex items-start gap-2.5 px-4 py-3 text-[13.5px] leading-relaxed">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{title && <strong className="font-semibold">{title} </strong>}{children}</span>
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="gd-tool-error px-4 py-3 text-[13.5px] leading-relaxed">{children}</div>;
}

/** Short labelled block inside a result panel ("Hazırlık", "Saklama"…). */
export function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="gd-tool-strong text-[13px] font-semibold uppercase tracking-[0.12em]">{title}</h3>
      <div className="mt-1 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
