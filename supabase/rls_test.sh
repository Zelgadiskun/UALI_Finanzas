#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:54321"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SERVICE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

STAMP=$(date +%s)
EMAIL_A="a-${STAMP}@test.local"
EMAIL_B="b-${STAMP}@test.local"
PASSWORD="test-password-123"

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

check "perfil de A creado (trigger)" "$([ -n "$UID_A" ] && echo 1 || echo 0)"
check "perfil de B creado (trigger)" "$([ -n "$UID_B" ] && echo 1 || echo 0)"

# Setup de familia con service_role (bypassa RLS a propósito, como haría la
# Edge Function de "unirse por código" en la fase de Familia).
FAM_RESP=$(curl -sS -X POST "$URL/rest/v1/families" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"name\":\"Familia de prueba\",\"code\":\"TEST-$STAMP\",\"owner_id\":\"$UID_A\"}")
FAM_ID=$(echo "$FAM_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -sS -X PATCH "$URL/rest/v1/profiles?id=in.($UID_A,$UID_B)" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" \
  -d "{\"family_id\":\"$FAM_ID\"}" > /dev/null

# A carga un movimiento privado y uno compartido, con su propio token (no service_role).
TX_PRIV=$(curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_A\",\"family_id\":\"$FAM_ID\",\"type\":\"gasto\",\"category\":\"Privado de A\",\"amount_cents\":10000,\"occurred_on\":\"2026-09-06\",\"shared\":false}")
TX_PRIV_ID=$(echo "$TX_PRIV" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

TX_SHARED=$(curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_A\",\"family_id\":\"$FAM_ID\",\"type\":\"gasto\",\"category\":\"Compartido de A\",\"amount_cents\":20000,\"occurred_on\":\"2026-09-06\",\"shared\":true}")
TX_SHARED_ID=$(echo "$TX_SHARED" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

check "el insert privado de A devolvió fila" "$([ -n "$TX_PRIV_ID" ] && echo 1 || echo 0)"
check "el insert compartido de A devolvió fila" "$([ -n "$TX_SHARED_ID" ] && echo 1 || echo 0)"

# B lee la tabla completa con su propia sesión.
SEEN_BY_B=$(curl -sS "$URL/rest/v1/transactions?select=id,category" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")

check "B NO ve el movimiento privado de A" "$(echo "$SEEN_BY_B" | grep -q "$TX_PRIV_ID" && echo 0 || echo 1)"
check "B SÍ ve el movimiento compartido de A" "$(echo "$SEEN_BY_B" | grep -q "$TX_SHARED_ID" && echo 1 || echo 0)"
COUNT_B=$(echo "$SEEN_BY_B" | grep -o '"id":' | wc -l)
check "B ve exactamente 1 movimiento (no más)" "$([ "$COUNT_B" = "1" ] && echo 1 || echo 0)"

# B intenta escribir sobre el movimiento privado de A.
UPD_BY_B=$(curl -sS -X PATCH "$URL/rest/v1/transactions?id=eq.$TX_PRIV_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"category":"hackeado"}')
check "B no puede modificar el movimiento privado de A" "$([ "$UPD_BY_B" = "[]" ] && echo 1 || echo 0)"

# A sigue viendo los suyos.
SEEN_BY_A=$(curl -sS "$URL/rest/v1/transactions?select=id" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A")
COUNT_A=$(echo "$SEEN_BY_A" | grep -o '"id":' | wc -l)
check "A ve sus propios 2 movimientos" "$([ "$COUNT_A" = "2" ] && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
