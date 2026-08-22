#!/bin/bash
set -euo pipefail

# POSTGRES_DB is the auth database, created by the official image.
# This script creates the users database on first volume init.
if [ -n "${USER_POSTGRES_DATABASE:-}" ] && [ "${USER_POSTGRES_DATABASE}" != "${POSTGRES_DB}" ]; then
  psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" \
    -c "CREATE DATABASE ${USER_POSTGRES_DATABASE};"
fi
