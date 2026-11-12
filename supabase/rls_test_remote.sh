#!/usr/bin/env bash
set -euo pipefail

URL="https://xfezkmsgwzvigxprfhwt.supabase.co"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZXprbXNnd3p2aWd4cHJmaHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjUwODMsImV4cCI6MjEwNDI0MTA4M30.SgLd_rYehE_FGCiFc4niagltQKNFox0rrw10_lysnZI"

STAMP=$(date +%s)
EMAIL_A="ffos-test-a-${STAMP}@mailinator.com"
EMAIL_B="ffos-test-b-${STAMP}@mailinator.com"
PASSWORD="test-password-123-xyz"

FAILURES=0
check() {
  local label="$1" cond="$2"
  if [ "$cond" = "1" ]; then echo "OK   $label"; else echo "FAIL $label"; FAILURES=$((FAILURES+1)); fi
}

signup() {
  curl -sS -X POST "$URL/auth/v1/signup" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}"
}

RESP_A=$(signup "$EMAIL_A")
RESP_B=$(signup "$EMAIL_B")
UID_A=$(echo "$RESP_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
UID_B=$(echo "$RESP_B" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_A=$(echo "$RESP_A" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_B=$(echo "$RESP_B" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

check "usuario A creado (signup real contra tu proyecto)" "$([ -n "$UID_A" ] && echo 1 || echo 0)"
check "usuario B creado" "$([ -n "$UID_B" ] && echo 1 || echo 0)"

if [ -z "$TOKEN_A" ] || [ -z "$TOKEN_B" ]; then
  echo ""
  echo "No se obtuvo sesión inmediata — probablemente tu proyecto tiene confirmación"
  echo "de email activada (es el default de Supabase). Respuesta cruda de A:"
  echo "$RESP_A"
  exit 1
fi

check "perfil de A creado por el trigger" "$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_A&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -q "$UID_A" && echo 1 || echo 0)"

# A carga un movimiento privado (sin family_id: todavía no hay familia).
TX_PRIV=$(curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_A\",\"type\":\"gasto\",\"category\":\"Privado de A\",\"amount_cents\":10000,\"occurred_on\":\"2026-09-06\",\"shared\":false}")
TX_PRIV_ID=$(echo "$TX_PRIV" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "el insert de A devolvió fila" "$([ -n "$TX_PRIV_ID" ] && echo 1 || echo 0)"

# B lee la tabla completa con su propia sesión — no debería ver nada de A.
SEEN_BY_B=$(curl -sS "$URL/rest/v1/transactions?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "B NO ve el movimiento privado de A" "$(echo "$SEEN_BY_B" | grep -q "$TX_PRIV_ID" && echo 0 || echo 1)"
check "B ve la tabla vacía (no tiene movimientos propios ni ajenos visibles)" "$([ "$SEEN_BY_B" = "[]" ] && echo 1 || echo 0)"

# B intenta escribir sobre el movimiento de A.
UPD_BY_B=$(curl -sS -X PATCH "$URL/rest/v1/transactions?id=eq.$TX_PRIV_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"category":"hackeado"}')
check "B no puede modificar el movimiento de A" "$([ "$UPD_BY_B" = "[]" ] && echo 1 || echo 0)"

# A sigue viendo el suyo.
SEEN_BY_A=$(curl -sS "$URL/rest/v1/transactions?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A")
check "A ve su propio movimiento" "$(echo "$SEEN_BY_A" | grep -q "$TX_PRIV_ID" && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto contra el proyecto real."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
