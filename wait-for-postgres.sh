#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_retries=30
retry_count=0

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "postgres" -U "nakama" -d "postgres" -c "SELECT 1" >/dev/null 2>&1; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "Error: Could not connect to PostgreSQL after $max_retries attempts"
    exit 1
  fi
  echo "PostgreSQL not ready yet. Retrying in 1 second... (Attempt $retry_count/$max_retries)"
  sleep 1
done

echo "PostgreSQL is up - running migrations..."
/nakama/nakama migrate up --database.address "postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/$POSTGRES_DB?sslmode=disable"

echo "Starting Nakama server..."
exec "$@"