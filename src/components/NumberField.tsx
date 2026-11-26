"use client";

import { useEffect, useRef, useState } from "react";
import { gaarchieAraUaryofitiRicxvs } from "@/lib/number-input.mjs";

type RicxvisVelisProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  inputMode?: "decimal" | "numeric" | "text";
  step?: number;
  min?: number;
  max?: number;
  onValidityChange?: (valid: boolean) => void;
};

export default function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  inputMode,
  step = 0.01,
  min = 0,
  max,
  onValidityChange
}: RicxvisVelisProps) {
  const [error, setError] = useState("");
  const mnishvnelobisResetisGadatovebisRef = useRef(false);
  const validurobisShecvlisRef = useRef(onValidityChange);
  validurobisShecvlisRef.current = onValidityChange;

  useEffect(() => {
    if (mnishvnelobisResetisGadatovebisRef.current) {
      mnishvnelobisResetisGadatovebisRef.current = false;
      return;
    }
    setError("");
    validurobisShecvlisRef.current?.(true);
  }, [value]);

  useEffect(() => {
    setError("");
    validurobisShecvlisRef.current?.(true);
  }, [step, min, max]);

  const atwiladiTanrigebi = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  const sheyvanisMaqsimumi = max ?? Number.MAX_SAFE_INTEGER / (10 ** atwiladiTanrigebi);
  const agwerisId = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        aria-describedby={agwerisId}
        aria-invalid={error ? true : undefined}
        min={min}
        max={sheyvanisMaqsimumi}
        step={step}
        {...(inputMode ? { inputMode } : {})}
        value={value ?? ""}
        onChange={(event) => {
          const gaarchuliMnishvneloba = gaarchieAraUaryofitiRicxvs(event.target.value, { step, min, max });
          setError(gaarchuliMnishvneloba.error ?? "");
          validurobisShecvlisRef.current?.(!gaarchuliMnishvneloba.error);
          mnishvnelobisResetisGadatovebisRef.current = Boolean(gaarchuliMnishvneloba.error) && !Object.is(value, gaarchuliMnishvneloba.value);
          onChange(gaarchuliMnishvneloba.value);
        }}
      />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <small id={`${id}-error`} className="field-error" role="alert">{error}</small>}
    </div>
  );
}
