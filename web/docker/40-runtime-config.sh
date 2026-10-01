#!/bin/sh
# Пишет рантайм-конфиг SPA из переменных окружения контейнера:
#   docker run -e API_URL=https://api.example.com adelante-web
set -eu

cat > /usr/share/nginx/html/config.js <<JS
window.__APP_CONFIG__ = {
  API_URL: "${API_URL:-}",
  WS_URL: "${WS_URL:-}",
  TELEGRAM_BOT_URL: "${TELEGRAM_BOT_URL:-}"
};
JS
