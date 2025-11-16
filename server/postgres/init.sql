-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE nakama'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nakama')\gexec

-- Create the user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nakama') THEN
        CREATE USER nakama WITH ENCRYPTED PASSWORD 'nakama_password';
    END IF;
END
$$;

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE nakama TO nakama;

-- Connect to the database
\c nakama

-- Grant privileges on the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nakama;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nakama;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO nakama;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO nakama;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO nakama;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO nakama;