/**
 * Evaluador matemático seguro para inputs de dinero estilo calculadora.
 * No utiliza eval(). Soporta +, -, *, /, paréntesis, porcentajes y comas decimales.
 */

// Normalizar caracteres comunes (×, ÷, coma decimal)
export function sanitizeMathExpression(input: string): string {
  return input.replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".").replace(/\s+/g, "");
}

// Tokenizador
type TokenType = "NUMBER" | "OP" | "LPAREN" | "RPAREN" | "PERCENT";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    if (char === "%") {
      tokens.push({ type: "PERCENT", value: "%" });
      i++;
      continue;
    }

    if (char === "+" || char === "*" || char === "/") {
      tokens.push({ type: "OP", value: char });
      i++;
      continue;
    }

    if (char === "-") {
      // Determinar si es operador binario o signo unario
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || prev.type === "OP" || prev.type === "LPAREN";
      if (isUnary) {
        // Leer el número que sigue
        let numStr = "-";
        i++;
        while (i < expr.length && /[\d.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        if (numStr === "-") {
          // Operador suelto o incompleto
          tokens.push({ type: "OP", value: "-" });
        } else {
          tokens.push({ type: "NUMBER", value: numStr });
        }
        continue;
      } else {
        tokens.push({ type: "OP", value: "-" });
        i++;
        continue;
      }
    }

    if (/[\d.]/.test(char)) {
      let numStr = "";
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: numStr });
      continue;
    }

    // Carácter desconocido, saltar
    i++;
  }

  return tokens;
}

/**
 * Evalúa tokens con precedencia de operadores usando Shunting-yard simplificado.
 */
function evaluateTokens(tokens: Token[]): number | null {
  if (tokens.length === 0) return null;

  // Manejar porcentajes inline: e.g. [A, +, B, %] -> A + (A * B / 100)
  const resolvedTokens: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "PERCENT") {
      const prev = resolvedTokens.pop();
      if (!prev || prev.type !== "NUMBER") return null;

      const baseVal = parseFloat(prev.value);
      if (isNaN(baseVal)) return null;

      // Buscar si antes había operador + o - y un número base
      const op = resolvedTokens[resolvedTokens.length - 1];
      const prevBase = resolvedTokens[resolvedTokens.length - 2];

      if (op && (op.value === "+" || op.value === "-") && prevBase && prevBase.type === "NUMBER") {
        const baseNum = parseFloat(prevBase.value);
        const percentAmount = (baseNum * baseVal) / 100;
        resolvedTokens.push({ type: "NUMBER", value: percentAmount.toString() });
      } else {
        // Porcentaje simple: e.g. 50 * 10% -> 50 * 0.1
        resolvedTokens.push({ type: "NUMBER", value: (baseVal / 100).toString() });
      }
    } else {
      resolvedTokens.push(t);
    }
  }

  // Shunting-yard algorithm
  const outputQueue: number[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
  };

  const applyOp = (op: string) => {
    if (outputQueue.length < 2) return false;
    const b = outputQueue.pop()!;
    const a = outputQueue.pop()!;
    let res = 0;
    switch (op) {
      case "+":
        res = a + b;
        break;
      case "-":
        res = a - b;
        break;
      case "*":
        res = a * b;
        break;
      case "/":
        if (b === 0) return false; // Evitar división por cero
        res = a / b;
        break;
      default:
        return false;
    }
    outputQueue.push(res);
    return true;
  };

  for (const token of resolvedTokens) {
    if (token.type === "NUMBER") {
      const val = parseFloat(token.value);
      if (isNaN(val)) return null;
      outputQueue.push(val);
    } else if (token.type === "OP") {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "(" &&
        (precedence[operatorStack[operatorStack.length - 1]] ?? 0) >= (precedence[token.value] ?? 0)
      ) {
        if (!applyOp(operatorStack.pop()!)) return null;
      }
      operatorStack.push(token.value);
    } else if (token.type === "LPAREN") {
      operatorStack.push("(");
    } else if (token.type === "RPAREN") {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
        if (!applyOp(operatorStack.pop()!)) return null;
      }
      if (operatorStack.length === 0) return null; // Paréntesis desbalanceados
      operatorStack.pop(); // Sacar '('
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === "(" || op === ")") return null;
    if (!applyOp(op)) return null;
  }

  if (outputQueue.length !== 1) return null;
  const result = outputQueue[0];
  if (!isFinite(result)) return null;

  return result;
}

/**
 * Evalúa una expresión matemática y retorna el número resultante o null si no es válida.
 */
export function evaluateMathExpression(rawExpr: string): number | null {
  if (!rawExpr || !rawExpr.trim()) return null;
  const cleaned = sanitizeMathExpression(rawExpr);
  // Si termina con operador abierto (ej: "15 +"), intentar evaluar sin el último operador
  let expressionToParse = cleaned;
  if (/[+\-*/]$/.test(expressionToParse)) {
    expressionToParse = expressionToParse.slice(0, -1);
  }
  // Si termina en punto decimal suelto (ej: "15."), removerlo
  if (/\.$/.test(expressionToParse)) {
    expressionToParse = expressionToParse.slice(0, -1);
  }
  if (!expressionToParse) return null;

  // Auto-cerrar paréntesis abiertos no cerrados para permitir vista previa fluida al escribir
  const openParens = (expressionToParse.match(/\(/g) || []).length;
  const closeParens = (expressionToParse.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    expressionToParse = expressionToParse + ")".repeat(openParens - closeParens);
  }

  try {
    const tokens = tokenize(expressionToParse);
    return evaluateTokens(tokens);
  } catch {
    return null;
  }
}

/**
 * Determina si un texto contiene operadores matemáticos activos.
 */
export function hasMathOperators(val: string): boolean {
  return /[+\-*×/÷%]/.test(val);
}

/**
 * Formatea el resultado calculado para mostrarlo en el input (hasta 2 decimales si corresponde).
 */
export function formatCalculatedResult(val: number): string {
  if (isNaN(val) || !isFinite(val)) return "0";
  // Redondear a 2 decimales
  const rounded = Math.round(val * 100) / 100;
  return rounded.toString();
}
