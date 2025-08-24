-- Initialize Budgeto database
-- This file is automatically executed when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by SQLModel/Alembic
-- This file just ensures the database is ready

-- Note: Demo users will be created by the backend after tables are set up
-- See backend startup for demo user creation

COMMENT ON DATABASE budgeto IS 'Budgeto - Student Finance App for Greece';