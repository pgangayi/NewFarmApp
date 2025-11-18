
    INSERT OR IGNORE INTO breeds (species, name, origin_country, purpose, average_weight, temperament) VALUES
    ('cattle', 'Holstein', 'Netherlands', 'Dairy', 680, 'Docile'),
    ('cattle', 'Angus', 'Scotland', 'Beef', 750, 'Calm'),
    ('chicken', 'Leghorn', 'Italy', 'Egg Production', 2.5, 'Active');

    INSERT OR IGNORE INTO crops (farm_id, crop_type, planting_date, status)
    VALUES ((SELECT id FROM farms WHERE owner_id = 'e2e-test-user-1' LIMIT 1), 'Corn', '2025-03-15', 'active');
    