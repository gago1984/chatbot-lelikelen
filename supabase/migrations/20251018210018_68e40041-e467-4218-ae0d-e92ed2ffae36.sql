-- Add attendance column to service_schedule table
ALTER TABLE service_schedule 
ADD COLUMN attendance INTEGER;

-- Update past services with sample attendance data (October services that already happened)
UPDATE service_schedule 
SET attendance = FLOOR(100 + RANDOM() * 21)::INTEGER,
    status = 'completed'
WHERE date < CURRENT_DATE;