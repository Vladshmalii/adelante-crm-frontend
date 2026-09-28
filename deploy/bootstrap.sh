#!/bin/sh
# Міграції й первинне наповнення прода. Запускається з backend-deploy.yml на кожен деплой,
# з каталогу проєкту на сервері, ДО перезапуску api/worker/beat/ws. Повторний запуск безпечний:
#   1. міграції Master DB;
#   2. немає жодного активного салону → створює салон з BOOTSTRAP_SALON_*;
#   3. немає жодного адміністратора → створює суперюзера з BOOTSTRAP_ADMIN_* з доступом до салону;
#   4. міграції всіх шардів.
#
# BOOTSTRAP_* беруться з .env (див. .env.example) і потрібні лише для першого деплою —
# коли салон і суперюзер уже є, кроки 2–3 пропускаються і змінні можна видалити.
# Вручну: sh deploy/bootstrap.sh
set -eu

COMPOSE="docker compose -f docker-compose.prod.yml"

# Команда в одноразовому контейнері з образом бекенда. Змінні ($BOOTSTRAP_*, SALON_*)
# розкриваються всередині контейнера — з env_file, а не з оболонки сервера.
manage() {
  $COMPOSE run --rm -T manage sh -c "$1"
}

# Скільки рядків у Master DB відповідає запиту (psql у контейнері postgres-master).
count() {
  $COMPOSE exec -T postgres-master psql -U adelante -d adelante_master -tAc "$1"
}

echo "==> Міграції Master DB"
manage 'salonctl migrate master'

if [ "$(count "SELECT count(*) FROM salons WHERE status = 'active'")" = "0" ]; then
  echo "==> Салонів немає — створюю перший салон"
  # salon create ідемпотентний за slug: якщо попередня спроба впала посередині, він її доробить.
  manage '
    : "${BOOTSTRAP_SALON_NAME:?Задайте BOOTSTRAP_SALON_NAME у .env}"
    : "${BOOTSTRAP_SALON_SLUG:?Задайте BOOTSTRAP_SALON_SLUG у .env}"
    : "${BOOTSTRAP_SALON_SECRET_ENV:?Задайте BOOTSTRAP_SALON_SECRET_ENV у .env}"
    salonctl salon create \
      --name "$BOOTSTRAP_SALON_NAME" \
      --slug "$BOOTSTRAP_SALON_SLUG" \
      --secret-env "$BOOTSTRAP_SALON_SECRET_ENV"
  '
else
  echo "==> Салон уже є — пропускаю"
fi

if [ "$(count "SELECT count(*) FROM administrators")" = "0" ]; then
  echo "==> Адміністраторів немає — створюю суперюзера"
  manage '
    : "${BOOTSTRAP_ADMIN_EMAIL:?Задайте BOOTSTRAP_ADMIN_EMAIL у .env}"
    : "${BOOTSTRAP_ADMIN_PASSWORD:?Задайте BOOTSTRAP_ADMIN_PASSWORD у .env}"
    : "${BOOTSTRAP_ADMIN_FIRST_NAME:?Задайте BOOTSTRAP_ADMIN_FIRST_NAME у .env}"
    : "${BOOTSTRAP_SALON_SLUG:?Задайте BOOTSTRAP_SALON_SLUG у .env}"
    salonctl administrator create \
      --email "$BOOTSTRAP_ADMIN_EMAIL" \
      --password "$BOOTSTRAP_ADMIN_PASSWORD" \
      --first-name "$BOOTSTRAP_ADMIN_FIRST_NAME" \
      --salon "$BOOTSTRAP_SALON_SLUG" \
      --superuser
  '
else
  echo "==> Адміністратор уже є — пропускаю"
fi

echo "==> Міграції шардів"
manage 'salonctl migrate shards'
