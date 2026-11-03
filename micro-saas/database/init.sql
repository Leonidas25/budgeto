-- Initialize Budgeto database
-- This file is automatically executed when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by SQLModel/Alembic
-- This file just ensures the database is ready

-- Optional: Create some initial data
-- INSERT INTO categories (name) VALUES 
--   ('Food'), ('Drinks'), ('Transport'), ('Shopping'), ('Entertainment'), ('Other');

COMMENT ON DATABASE budgeto IS 'Budgeto - Student Finance App for Greece';