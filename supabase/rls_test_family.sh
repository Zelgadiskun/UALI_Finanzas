#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:54321"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

STAMP=$(date +%s)
EMAIL_A="fam-a-${STAMP}@test.local"
EMAIL_B="fam-b-${STAMP}@test.local"
EMAIL_C="fam-c-${STAMP}@test.local"
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
rpc() {
  # rpc <token> <fn> <json-args>
  curl -sS -X POST "$URL/rest/v1/rpc/$2" \
    -H "apikey: $ANON" -H "Authorization: Bearer $1" \
    -H "Content-Type: application/json" -d "$3"
}

TOKEN_A=$(echo "$(signup "$EMAIL_A")" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
UID_B_RESP=$(signup "$EMAIL_B")
TOKEN_B=$(echo "$UID_B_RESP" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
UID_B=$(echo "$UID_B_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_C=$(echo "$(signup "$EMAIL_C")" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

# A crea una familia.
FAM=$(rpc "$TOKEN_A" create_family "{\"p_name\":\"Familia Test $STAMP\"}")
FAM_ID=$(echo "$FAM" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
FAM_CODE=$(echo "$FAM" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
check "A creó la familia y recibió código" "$([ -n "$FAM_CODE" ] && echo 1 || echo 0)"

# El intento de un cliente de setear family_id a mano sigue bloqueado (fase 3).
CHEAT=$(curl -sS -X PATCH "$URL/rest/v1/profiles?id=eq.$UID_B" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"family_id\":\"$FAM_ID\"}")
check "B NO puede unirse pisando family_id a mano" "$(echo "$CHEAT" | grep -q '"code":"42501"' && echo 1 || echo 0)"

# B se une con el código real, vía la función.
JOIN_RESP=$(rpc "$TOKEN_B" join_family "{\"p_code\":\"$FAM_CODE\"}")
check "B se unió con el código real" "$(echo "$JOIN_RESP" | grep -q "$FAM_ID" && echo 1 || echo 0)"

BAD_JOIN=$(rpc "$TOKEN_C" join_family '{"p_code":"ZZZZZZ"}')
check "C no puede unirse con un código inválido" "$(echo "$BAD_JOIN" | grep -q 'Código inválido' && echo 1 || echo 0)"

# A carga un movimiento privado y uno compartido.
UID_A=$(curl -sS "$URL/auth/v1/user" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

TX_PRIV=$(curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_A\",\"family_id\":\"$FAM_ID\",\"type\":\"gasto\",\"category\":\"Privado de A\",\"amount_cents\":1000,\"occurred_on\":\"2026-09-06\",\"shared\":false}")
TX_PRIV_ID=$(echo "$TX_PRIV" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

TX_SHARED=$(curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_A\",\"family_id\":\"$FAM_ID\",\"type\":\"gasto\",\"category\":\"Compartido de A\",\"amount_cents\":2000,\"occurred_on\":\"2026-09-06\",\"shared\":true}")
TX_SHARED_ID=$(echo "$TX_SHARED" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# B (mismo family_id ahora) ve el compartido, no el privado.
SEEN_BY_B=$(curl -sS "$URL/rest/v1/transactions?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "B (en la familia) ve el compartido de A" "$(echo "$SEEN_BY_B" | grep -q "$TX_SHARED_ID" && echo 1 || echo 0)"
check "B (en la familia) NO ve el privado de A" "$(echo "$SEEN_BY_B" | grep -q "$TX_PRIV_ID" && echo 0 || echo 1)"

# C (fuera de la familia) no ve ninguno de los dos.
SEEN_BY_C=$(curl -sS "$URL/rest/v1/transactions?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C")
check "C (fuera de la familia) no ve nada de A" "$([ "$SEEN_BY_C" = "[]" ] && echo 1 || echo 0)"

# Invitación dirigida a C, y aceptación.
INV=$(curl -sS -X POST "$URL/rest/v1/invitations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"family_id\":\"$FAM_ID\",\"from_user_id\":\"$UID_A\",\"to_email\":\"$EMAIL_C\",\"family_name\":\"Familia Test\",\"from_display_name\":\"A\"}")
INV_ID=$(echo "$INV" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "la invitación a C se creó" "$([ -n "$INV_ID" ] && echo 1 || echo 0)"

PENDING_FOR_C=$(curl -sS "$URL/rest/v1/invitations?to_email=eq.$EMAIL_C&status=eq.pending&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C")
check "C ve la invitación pendiente" "$(echo "$PENDING_FOR_C" | grep -q "$INV_ID" && echo 1 || echo 0)"

ACCEPT=$(rpc "$TOKEN_C" accept_invitation "{\"p_invitation_id\":\"$INV_ID\"}")
check "C aceptó y quedó en la familia de A" "$(echo "$ACCEPT" | grep -q "$FAM_ID" && echo 1 || echo 0)"

SEEN_BY_C_AFTER=$(curl -sS "$URL/rest/v1/transactions?select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C")
check "C, ya en la familia, ve el compartido de A" "$(echo "$SEEN_BY_C_AFTER" | grep -q "$TX_SHARED_ID" && echo 1 || echo 0)"

DOUBLE_ACCEPT=$(rpc "$TOKEN_C" accept_invitation "{\"p_invitation_id\":\"$INV_ID\"}")
check "aceptar dos veces la misma invitación falla" "$(echo "$DOUBLE_ACCEPT" | grep -q 'ya fue respondida' && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
