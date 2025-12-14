-- Seed data for development/testing

-- Create a test organization
INSERT INTO organizations (id, name, slug) VALUES
('00000000-0000-0000-0000-000000000001', 'Test Organization', 'test-org')
ON CONFLICT DO NOTHING;

-- Note: User organizations and other data should be created through the application
-- This seed file is for reference only






