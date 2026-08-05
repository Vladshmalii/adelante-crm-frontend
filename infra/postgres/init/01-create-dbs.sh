#!/bin/bash
# Runs once, only when the postgres data volume is first initialized.
set -e

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE adelante_salon_a;
    CREATE DATABASE adelante_salon_b;
EOSQL
