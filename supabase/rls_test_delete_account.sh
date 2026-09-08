#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:54321"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
STAMP=$(date +%s)

FAILURES=0
check() {
  local label="$1" cond="$2"
  if [ "$cond" = "1" ]; then echo "OK   $label"; else echo "FAIL $label"; FAILURES=$((FAILURES+1)); fi
}

signup() {
  local email="$1"
  curl -sS -X POST "$URL/auth/v1/signup" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"test-password-123\"}"
}

# --- Caso 1: administrador de familia con otro miembro -> se transfiere, no se borra la familia.
RESP_A=$(signup "del-owner-${STAMP}@test.local")
UID_A=$(echo "$RESP_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_A=$(echo "$RESP_A" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

RESP_B=$(signup "del-member-${STAMP}@test.local")
UID_B=$(echo "$RESP_B" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_B=$(echo "$RESP_B" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

FAM=$(curl -sS -X POST "$URL/rest/v1/rpc/create_family" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" -d '{"p_name":"Fam Delete"}')
CODE=$(echo "$FAM" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
curl -sS -X POST "$URL/rest/v1/rpc/join_family" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" -d "{\"p_code\":\"$CODE\"}" > /dev/null

FAMILY_ID=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_A&select=family_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"family_id":"[^"]*"' | head -1 | cut -d'"' -f4)

# A (dueño) borra su cuenta.
curl -sS -X POST "$URL/rest/v1/rpc/delete_own_account" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" -d '{}' > /dev/null

# La familia sigue existiendo, ahora administrada por B.
FAM_AFTER=$(curl -sS "$URL/rest/v1/families?id=eq.$FAMILY_ID&select=owner_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "la familia sigue existiendo tras borrar al dueño (se transfirió, no se borró)" "$(echo "$FAM_AFTER" | grep -q "$FAMILY_ID" 2>/dev/null; echo "$FAM_AFTER" | grep -q '"owner_id"' && echo 1 || echo 0)"
check "B quedó como nuevo administrador de la familia" "$(echo "$FAM_AFTER" | grep -q "\"owner_id\":\"$UID_B\"" && echo 1 || echo 0)"

# El perfil y el usuario de A ya no existen.
PROFILE_A=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_A" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "el perfil de A ya no existe" "$([ "$PROFILE_A" = "[]" ] && echo 1 || echo 0)"

LOGIN_A=$(curl -sS -w "\n%{http_code}" -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" -H "Content-Type: application/json" -d "{\"email\":\"del-owner-${STAMP}@test.local\",\"password\":\"test-password-123\"}")
LOGIN_A_STATUS=$(echo "$LOGIN_A" | tail -1)
check "A ya no puede iniciar sesión (usuario borrado)" "$([ "$LOGIN_A_STATUS" != "200" ] && echo 1 || echo 0)"

# B sigue existiendo con su cuenta intacta.
PROFILE_B=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_B&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "B (miembro sobreviviente) conserva su cuenta" "$(echo "$PROFILE_B" | grep -q "$UID_B" && echo 1 || echo 0)"

# --- Caso 2: único miembro de su familia -> se borra la familia entera con él.
RESP_C=$(signup "del-solo-${STAMP}@test.local")
UID_C=$(echo "$RESP_C" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_C=$(echo "$RESP_C" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

FAM_C=$(curl -sS -X POST "$URL/rest/v1/rpc/create_family" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C" -H "Content-Type: application/json" -d '{"p_name":"Fam Solo"}')
FAMILY_C_ID=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_C&select=family_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C" | grep -o '"family_id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -sS -X POST "$URL/rest/v1/rpc/delete_own_account" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_C" -H "Content-Type: application/json" -d '{}' > /dev/null

# Sin sesión propia para consultar (se borró) — usamos el service role local para verificar el estado final.
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
FAM_C_AFTER=$(curl -sS "$URL/rest/v1/families?id=eq.$FAMILY_C_ID" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY")
check "la familia de un único miembro se borra en cascada con él" "$([ "$FAM_C_AFTER" = "[]" ] && echo 1 || echo 0)"

# --- Caso 3: sin sesión no se puede llamar la función.
NO_SESSION=$(curl -sS -w "\n%{http_code}" -X POST "$URL/rest/v1/rpc/delete_own_account" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{}')
NO_SESSION_STATUS=$(echo "$NO_SESSION" | tail -1)
check "sin sesión, la función rechaza (no hay auth.uid())" "$([ "$NO_SESSION_STATUS" != "200" ] && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
