#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:54321"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

STAMP=$(date +%s)
EMAIL="trig-${STAMP}@test.local"
PASSWORD="test-password-123"

FAILURES=0
check() {
  local label="$1" cond="$2"
  if [ "$cond" = "1" ]; then echo "OK   $label"; else echo "FAIL $label"; FAILURES=$((FAILURES+1)); fi
}

RESP=$(curl -sS -X POST "$URL/auth/v1/signup" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
UID_=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN=$(echo "$RESP" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
check "usuario creado" "$([ -n "$UID_" ] && echo 1 || echo 0)"

# xp/streak arrancan en 0.
BEFORE=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_&select=xp,streak" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "profile arranca en xp=0" "$(echo "$BEFORE" | grep -q '"xp":0' && echo 1 || echo 0)"

# Insertar un ingreso (+5 xp) — sin tocar profiles directamente.
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_\",\"type\":\"ingreso\",\"category\":\"Sueldo\",\"amount_cents\":100000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null

AFTER=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_&select=xp,streak,last_active" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "xp subió a 5 tras el ingreso" "$(echo "$AFTER" | grep -q '"xp":5' && echo 1 || echo 0)"
check "streak pasó a 1 (primera actividad)" "$(echo "$AFTER" | grep -q '"streak":1' && echo 1 || echo 0)"

ACH=$(curl -sS "$URL/rest/v1/user_achievements?user_id=eq.$UID_&select=achievement_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "logro first_tx desbloqueado" "$(echo "$ACH" | grep -q 'first_tx' && echo 1 || echo 0)"

# Insertar un ahorro (+10 xp) el mismo día — la racha no debe subir dos veces el mismo día.
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_\",\"type\":\"ahorro\",\"category\":\"Fondo\",\"amount_cents\":50000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null

AFTER2=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_&select=xp,streak" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "xp subió a 15 (5+10) tras el ahorro" "$(echo "$AFTER2" | grep -q '"xp":15' && echo 1 || echo 0)"
check "streak se mantiene en 1 (mismo día, no duplica)" "$(echo "$AFTER2" | grep -q '"streak":1' && echo 1 || echo 0)"

ACH2=$(curl -sS "$URL/rest/v1/user_achievements?user_id=eq.$UID_&select=achievement_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "logro saver desbloqueado" "$(echo "$ACH2" | grep -q 'saver' && echo 1 || echo 0)"

# Intento directo de hacerse trampa: escribir xp a mano.
CHEAT=$(curl -sS -X PATCH "$URL/rest/v1/profiles?id=eq.$UID_" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"xp":999999}')
check "el cliente NO puede pisar xp a mano (bloqueado por grant de columna)" "$(echo "$CHEAT" | grep -q '"xp":999999' && echo 0 || echo 1)"

# Completar una lección — el xp ya no lo manda el cliente, sale de lessons.xp.
INTRO_ID=$(curl -sS "$URL/rest/v1/lessons?slug=eq.intro&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "lección 'intro' existe en el catálogo" "$([ -n "$INTRO_ID" ] && echo 1 || echo 0)"

curl -sS -X POST "$URL/rest/v1/lesson_progress" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_\",\"lesson_id\":\"$INTRO_ID\"}" > /dev/null

AFTER3=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_&select=xp" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "xp subió a 40 (15+25) tras completar la lección" "$(echo "$AFTER3" | grep -q '"xp":40' && echo 1 || echo 0)"

ACH3=$(curl -sS "$URL/rest/v1/user_achievements?user_id=eq.$UID_&select=achievement_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
check "logro first_lesson desbloqueado" "$(echo "$ACH3" | grep -q 'first_lesson' && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
