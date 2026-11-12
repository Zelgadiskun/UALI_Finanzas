#!/usr/bin/env bash
# Keepalive heartbeat for UALÍ Finanzas dev server
# Prevents idle teardown and ensures warm sub-50ms response times

while true; do
  sleep 45
  curl -s -o /dev/null --max-time 2 http://localhost:3000/ 2>/dev/null || true
  curl -s -o /dev/null --max-time 2 http://localhost:8080/api/health 2>/dev/null || true
done
