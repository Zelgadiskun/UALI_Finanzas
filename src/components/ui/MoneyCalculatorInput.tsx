import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Calculator, Equal, Delete, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  evaluateMathExpression,
  hasMathOperators,
  formatCalculatedResult,
} from "@/lib/ffos/calculator";
import { cn } from "@/lib/utils";

interface MoneyCalculatorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  currencySymbol?: string;
  currencyCode?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  allowZero?: boolean;
  label?: string;
  helperText?: string;
  showKeypadByDefault?: boolean;
}

export function MoneyCalculatorInput({
  value,
  onChange,
  placeholder = "0.00",
  className,
  autoFocus = false,
  currencySymbol = "$",
  currencyCode = "USD",
  error,
  size = "lg",
  label,
  helperText,
  showKeypadByDefault = false,
}: MoneyCalculatorInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [showKeypad, setShowKeypad] = useState(showKeypadByDefault);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor externo cuando cambie fuera de este componente
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Evaluación en tiempo real de la expresión
  const evaluatedResult = useMemo(() => {
    if (!hasMathOperators(internalValue)) return null;
    const res = evaluateMathExpression(internalValue);
    return res !== null ? formatCalculatedResult(res) : null;
  }, [internalValue]);

  // Aplicar el resultado calculado
  const applyCalculation = useCallback(() => {
    if (evaluatedResult !== null) {
      setInternalValue(evaluatedResult);
      onChange(evaluatedResult);
    }
  }, [evaluatedResult, onChange]);

  // Manejador del cambio de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir dígitos, puntos, comas y operadores matemáticos (+, -, *, /, ×, ÷, %, paréntesis)
    const raw = e.target.value;
    const sanitized = raw.replace(/[^\d.,+\-*×/÷%()\s]/g, "");
    setInternalValue(sanitized);

    // Si es un número normal sin operadores, sincronizar directamente
    if (!hasMathOperators(sanitized)) {
      const cleanNumber = sanitized.replace(/,/g, ".");
      onChange(cleanNumber);
    } else {
      const evalRes = evaluateMathExpression(sanitized);
      if (evalRes !== null) {
        onChange(formatCalculatedResult(evalRes));
      }
    }
  };

  // Manejador de teclas especiales (Enter o = calcula)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "=") {
      e.preventDefault();
      applyCalculation();
    }
  };

  // Al perder el foco, si hay una expresión válida, resolverla
  const handleBlur = () => {
    if (hasMathOperators(internalValue)) {
      if (evaluatedResult !== null) {
        setInternalValue(evaluatedResult);
        onChange(evaluatedResult);
      } else {
        // Si la expresión estaba incompleta (ej: "10+"), intentar evaluar quitando operador final
        const fallback = evaluateMathExpression(internalValue);
        if (fallback !== null) {
          const formatted = formatCalculatedResult(fallback);
          setInternalValue(formatted);
          onChange(formatted);
        }
      }
    }
  };

  // Operaciones de botones de la barra de calculadora
  const insertSymbol = (sym: string) => {
    let next = internalValue;
    if (sym === "C") {
      next = "";
    } else if (sym === "=") {
      applyCalculation();
      inputRef.current?.focus();
      return;
    } else if (sym === "DEL") {
      next = next.slice(0, -1);
    } else {
      // Si el último caracter ya es un operador binario, reemplazarlo
      if (/[+\-*×/÷]$/.test(next.trim()) && /[+\-*×/÷]/.test(sym)) {
        next = next.trim().slice(0, -1) + sym;
      } else {
        next = `${next}${sym}`;
      }
    }

    setInternalValue(next);
    if (!hasMathOperators(next)) {
      onChange(next.replace(/,/g, "."));
    } else {
      const evalRes = evaluateMathExpression(next);
      if (evalRes !== null) {
        onChange(formatCalculatedResult(evalRes));
      }
    }
    inputRef.current?.focus();
  };

  const isCalculating = hasMathOperators(internalValue);

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          {error && <span className="text-[10px] text-danger font-semibold">{error}</span>}
        </div>
      )}

      {/* Contenedor del Input con Indicador de Moneda y Estado de Calculadora */}
      <div
        className={cn(
          "relative bg-secondary/80 border rounded-2xl text-foreground font-bold p-3 transition-all shadow-inner",
          error
            ? "border-danger focus-within:ring-2 focus-within:ring-danger/20"
            : isCalculating
              ? "border-amber-400/80 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20"
              : "border-border/80 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Lado izquierdo: Símbolo de moneda e Input de texto/cálculo */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={cn(
                "font-black shrink-0 transition-colors",
                size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base",
                isCalculating ? "text-amber-400" : "text-teal-400",
              )}
            >
              {currencySymbol}
            </span>

            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoFocus={autoFocus}
              value={internalValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                "w-full bg-transparent border-none font-black text-foreground placeholder:text-muted-foreground/60 focus:outline-none p-0 tracking-tight min-w-0",
                size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base",
              )}
            />
          </div>

          {/* Lado derecho: Botón calculadora + Badge de Moneda */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botón para desplegar / ocultar teclado de calculadora */}
            <button
              type="button"
              onClick={() => setShowKeypad((v) => !v)}
              title={showKeypad ? "Ocultar teclado de calculadora" : "Abrir teclado de calculadora"}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer",
                showKeypad || isCalculating
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs"
                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground",
              )}
            >
              <Calculator className="size-3.5" />
              <span className="hidden sm:inline text-[10px]">Calc</span>
              {showKeypad ? (
                <ChevronUp className="size-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3 text-muted-foreground" />
              )}
            </button>

            {/* Código de moneda */}
            <div className="flex items-center gap-1 bg-card border border-border/80 px-2 py-1 rounded-xl">
              <span className="text-[11px] font-bold text-slate-300">{currencyCode}</span>
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Fila de Resultado de Cálculo en Vivo (si el usuario está usando operadores) */}
        {isCalculating && (
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="size-3" />
                <span>Expresión activa</span>
              </span>
            </div>

            {evaluatedResult !== null ? (
              <button
                type="button"
                onClick={applyCalculation}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-xs transition active:scale-95 cursor-pointer shadow-xs"
                title="Toca para aplicar el resultado de la cuenta"
              >
                <span>= ${evaluatedResult}</span>
                <Check className="size-3 stroke-[3]" />
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Escribe un número para completar el cálculo…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra Rápida de Operadores Matemáticos (+, -, ×, ÷, %, =, C) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mr-0.5 shrink-0">
          Operadores:
        </span>
        {[
          { label: "+", val: " + ", title: "Sumar" },
          { label: "-", val: " - ", title: "Restar" },
          { label: "×", val: " * ", title: "Multiplicar" },
          { label: "÷", val: " / ", title: "Dividir" },
          { label: "%", val: "%", title: "Porcentaje" },
          { label: "( )", val: "()", title: "Paréntesis" },
          { label: "=", val: "=", title: "Calcular resultado" },
          { label: "C", val: "C", title: "Limpiar monto" },
        ].map((op) => (
          <button
            key={op.label}
            type="button"
            onClick={() => {
              if (op.val === "()") {
                // Si ya hay un '(', cerrar con ')'
                const openCount = (internalValue.match(/\(/g) || []).length;
                const closeCount = (internalValue.match(/\)/g) || []).length;
                if (openCount > closeCount) insertSymbol(")");
                else insertSymbol("(");
              } else {
                insertSymbol(op.val);
              }
            }}
            title={op.title}
            className={cn(
              "size-7 rounded-lg font-black text-xs transition-all active:scale-90 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs",
              op.label === "="
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black hover:brightness-105"
                : op.label === "C"
                  ? "bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/70"
                  : "bg-secondary/90 hover:bg-secondary text-foreground border border-border/80 hover:border-amber-400/50",
            )}
          >
            {op.label === "=" ? <Equal className="size-3.5 stroke-[3]" /> : op.label}
          </button>
        ))}
      </div>

      {/* Teclado Completo de Calculadora Numérica (Ideal para pantallas táctiles y móviles) */}
      {showKeypad && (
        <div className="bg-secondary/60 rounded-2xl p-2.5 border border-border/80 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "7", val: "7" },
              { label: "8", val: "8" },
              { label: "9", val: "9" },
              { label: "÷", val: " / ", isOp: true },

              { label: "4", val: "4" },
              { label: "5", val: "5" },
              { label: "6", val: "6" },
              { label: "×", val: " * ", isOp: true },

              { label: "1", val: "1" },
              { label: "2", val: "2" },
              { label: "3", val: "3" },
              { label: "-", val: " - ", isOp: true },

              { label: "0", val: "0" },
              { label: ".", val: "." },
              { label: "%", val: "%", isOp: true },
              { label: "+", val: " + ", isOp: true },
            ].map((key) => (
              <button
                key={key.label}
                type="button"
                onClick={() => insertSymbol(key.val)}
                className={cn(
                  "h-10 rounded-xl font-black text-sm flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer",
                  key.isOp
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                    : "bg-card border border-border/80 text-foreground hover:bg-card/80",
                )}
              >
                {key.label}
              </button>
            ))}
          </div>

          {/* Fila inferior del teclado: Limpiar, Borrar caracter y Calcular (=) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => insertSymbol("C")}
              className="h-10 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground font-black text-xs border border-border/80 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Limpiar</span>
            </button>

            <button
              type="button"
              onClick={() => insertSymbol("DEL")}
              className="h-10 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-black text-xs border border-border/80 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              title="Borrar último caracter"
            >
              <Delete className="size-4" />
            </button>

            <button
              type="button"
              onClick={applyCalculation}
              className="h-10 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-105 text-slate-950 font-black text-sm transition active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              title="Calcular y aplicar resultado"
            >
              <Equal className="size-4 stroke-[3]" />
              <span>Calcular</span>
            </button>
          </div>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[10px] text-muted-foreground leading-tight">{helperText}</p>
      )}
    </div>
  );
}
