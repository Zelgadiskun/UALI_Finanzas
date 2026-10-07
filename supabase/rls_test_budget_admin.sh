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

# A crea la familia (admin de presupuesto), B se une (miembro con cupo).
RESP_A=$(signup "budget-admin-${STAMP}@test.local")
UID_A=$(echo "$RESP_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_A=$(echo "$RESP_A" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

RESP_B=$(signup "budget-member-${STAMP}@test.local")
UID_B=$(echo "$RESP_B" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TOKEN_B=$(echo "$RESP_B" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

check "A y B se crearon" "$([ -n "$UID_A" ] && [ -n "$UID_B" ] && echo 1 || echo 0)"

FAM=$(curl -sS -X POST "$URL/rest/v1/rpc/create_family" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"p_name":"Familia Presupuesto"}')
CODE=$(echo "$FAM" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
check "A creó la familia" "$([ -n "$CODE" ] && echo 1 || echo 0)"

curl -sS -X POST "$URL/rest/v1/rpc/join_family" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -d "{\"p_code\":\"$CODE\"}" > /dev/null

# A crea el presupuesto "Comida" — A queda como administrador (created_by).
FAMILY_ID=$(curl -sS "$URL/rest/v1/profiles?id=eq.$UID_A&select=family_id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"family_id":"[^"]*"' | head -1 | cut -d'"' -f4)

BUD=$(curl -sS -X POST "$URL/rest/v1/budgets" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"family_id\":\"$FAMILY_ID\",\"name\":\"Comida\",\"bucket\":\"Variables\",\"planned_cents\":50000}")
BUDGET_ID=$(echo "$BUD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CREATED_BY=$(echo "$BUD" | grep -o '"created_by":"[^"]*"' | head -1 | cut -d'"' -f4)
check "presupuesto creado con A como administrador (created_by = A)" "$([ "$CREATED_BY" = "$UID_A" ] && echo 1 || echo 0)"

# B (no administrador) NO puede editar el presupuesto de A.
EDIT_BY_B=$(curl -sS -X PATCH "$URL/rest/v1/budgets?id=eq.$BUDGET_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"planned_cents":999900}')
check "B (no admin) NO puede editar el presupuesto de A" "$([ "$EDIT_BY_B" = "[]" ] && echo 1 || echo 0)"

# B sí puede LEER el presupuesto (toda la familia lo ve).
READ_BY_B=$(curl -sS "$URL/rest/v1/budgets?id=eq.$BUDGET_ID&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B")
check "B sí puede leer el presupuesto de A" "$(echo "$READ_BY_B" | grep -q "$BUDGET_ID" && echo 1 || echo 0)"

# A reparte $300 a B dentro de ese presupuesto de $500.
ALLOC=$(curl -sS -X POST "$URL/rest/v1/budget_allocations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"budget_id\":\"$BUDGET_ID\",\"user_id\":\"$UID_B\",\"allocated_cents\":30000}")
check "A repartió cupo a B" "$(echo "$ALLOC" | grep -q '"allocated_cents":30000' && echo 1 || echo 0)"

# B no puede auto-asignarse un cupo (solo el admin reparte).
SELF_ALLOC=$(curl -sS -X POST "$URL/rest/v1/budget_allocations" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"budget_id\":\"$BUDGET_ID\",\"user_id\":\"$UID_B\",\"allocated_cents\":99900}")
check "B NO puede auto-asignarse cupo (solo el admin reparte)" "$(echo "$SELF_ALLOC" | grep -q '"code":"42501"' && echo 1 || echo 0)"

# B gasta $280 (93% de $300) — cruza el umbral de aviso (90%).
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_B\",\"family_id\":\"$FAMILY_ID\",\"type\":\"gasto\",\"category\":\"Comida\",\"amount_cents\":28000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null

NOTIF_A=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=type,payload" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A")
check "A (admin) recibió el aviso de 90% cuando B se acercó al límite" "$(echo "$NOTIF_A" | grep -q '"level": "warning"' && echo 1 || echo 0)"
check "B NO ve notificaciones de A (son privadas por destinatario)" "$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" | grep -q "$UID_A" && echo 0 || echo 1)"

# B gasta $30 más (ahora $310 de $300) — cruza el 100%.
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_B\",\"family_id\":\"$FAMILY_ID\",\"type\":\"gasto\",\"category\":\"Comida\",\"amount_cents\":3000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null

NOTIF_A2=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=payload&order=created_at.desc&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A")
check "A recibió un SEGUNDO aviso, esta vez de 'over' (100%)" "$(echo "$NOTIF_A2" | grep -q '"level": "over"' && echo 1 || echo 0)"

# Un tercer gasto chico no debe generar un tercer aviso (ya cruzó ambos umbrales).
BEFORE_COUNT=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id"' | wc -l)
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_B\",\"family_id\":\"$FAMILY_ID\",\"type\":\"gasto\",\"category\":\"Comida\",\"amount_cents\":1000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null
AFTER_COUNT=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id"' | wc -l)
check "un gasto adicional ya sobre el límite NO repite el aviso" "$([ "$BEFORE_COUNT" = "$AFTER_COUNT" ] && echo 1 || echo 0)"

# A marca su propia notificación como leída.
NOTIF_ID=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=id&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
MARKED=$(curl -sS -X PATCH "$URL/rest/v1/notifications?id=eq.$NOTIF_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"read_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
check "A puede marcar su propia notificación como leída" "$(echo "$MARKED" | grep -q '"read_at":null' && echo 0 || echo 1)"

# Gasto de A mismo (el administrador) en su propio presupuesto NO se auto-notifica.
BEFORE_SELF=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id"' | wc -l)
curl -sS -X POST "$URL/rest/v1/transactions" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_A\",\"family_id\":\"$FAMILY_ID\",\"type\":\"gasto\",\"category\":\"Comida\",\"amount_cents\":100000,\"occurred_on\":\"$(date +%F)\",\"shared\":false}" > /dev/null
AFTER_SELF=$(curl -sS "$URL/rest/v1/notifications?user_id=eq.$UID_A&select=id" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id"' | wc -l)
check "el gasto del propio administrador no le genera un aviso a sí mismo" "$([ "$BEFORE_SELF" = "$AFTER_SELF" ] && echo 1 || echo 0)"

echo ""
if [ "$FAILURES" = "0" ]; then echo "Todo correcto."; else echo "$FAILURES verificación(es) fallaron."; fi
exit "$FAILURES"
