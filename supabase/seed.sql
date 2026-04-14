-- Reset and Seed for Property Management Module
-- Run this to populate initial data for testing

-- 1. Property Categories
TRUNCATE property_categories CASCADE;
INSERT INTO property_categories (name, slug) VALUES 
('Luxury Villa', 'luxury-villa'),
('Beachfront Land', 'beachfront-land'),
('Residential Land', 'residential-land'),
('Mountain Cabin', 'mountain-cabin'),
('Commercial Space', 'commercial-space'),
('Hotel/Resort', 'hotel-resort'),
('Traditional House', 'traditional-house');

-- 2. Properties (Lombok Region)
-- Using dynamic specifications (JSONB)
TRUNCATE properties CASCADE;
INSERT INTO properties (
    title, 
    slug, 
    description, 
    listing_type, 
    category_id, 
    price, 
    currency, 
    location,
    city,
    main_image,
    status,
    specifications,
    amenities,
    marketing_copy
) VALUES 
(
    'Rinjani Eco Resort Villa', 
    'rinjani-eco-resort-villa', 
    'Sustainable luxury villa located at the foot of Mount Rinjani with breathtaking valley views.', 
    'sale', 
    (SELECT id FROM property_categories WHERE slug = 'luxury-villa'), 
    4500000000, 
    'IDR', 
    'Sembalun Lawang, East Lombok', 
    'East Lombok',
    '/images/properties/sembalun-1.jpg', 
    'active', 
    '{"bedrooms": 3, "bathrooms": 3, "land_size": 1200, "building_size": 250, "electricity": "5500W", "water": "Mountain Spring"}',
    '["pool", "garden", "fireplace", "eco_friendly"]', 
    '{"seo_title": "Eco Resort Villa Sembalun", "social_caption": "Wake up to the clouds in Sembalun. 🏔️ #LombokProperty"}'
),
(
    'Gili T Beachfront Estate', 
    'gili-t-beachfront-estate', 
    'Prime beachfront land on the sunset side of Gili Trawangan. Perfect for a boutique hotel.', 
    'sale', 
    (SELECT id FROM property_categories WHERE slug = 'beachfront-land'), 
    8500000000, 
    'IDR', 
    'Gili Trawangan Sunset Point', 
    'North Lombok',
    '/images/properties/gili-1.jpg', 
    'active', 
    '{"land_size": 2500, "zoning": "Tourism Zone", "legal": "SHM", "beach_frontage": "40m"}',
    '["beach_access", "sunset_view"]', 
    '{"seo_title": "Beachfront Estate Gili T", "social_caption": "Rare beachfront opportunity in Gili T. 🏖️ #GiliTrawangan"}'
),
(
    'Kuta Surf Lodge', 
    'kuta-surf-lodge', 
    'Active surf lodge with 10 guest rooms, just minutes away from Mandalika Circuit.', 
    'rent', 
    (SELECT id FROM property_categories WHERE slug = 'commercial-space'), 
    250000000, 
    'IDR', 
    'Jl. Pariwisata Kuta No. 88', 
    'Kuta Lombok', 
    '/images/properties/kuta-1.jpg', 
    'active', 
    '{"total_rooms": 10, "land_size": 800, "building_size": 600, "contract_years": 10, "license": "Pondok Wisata"}',
    '["surf_rack", "shared_pool", "fast_wifi"]', 
    '{"seo_title": "Surf Lodge Kuta Lombok", "social_caption": "Minutes away from the best waves and the Circuit! 🏄‍♂️ #Mandalika"}'
);

-- 2.1 Sample Property Images (Gallery)
INSERT INTO property_images (property_id, image_url, is_primary) VALUES 
((SELECT id FROM properties WHERE slug = 'rinjani-eco-resort-villa' LIMIT 1), '/images/properties/sembalun-1.jpg', true),
((SELECT id FROM properties WHERE slug = 'rinjani-eco-resort-villa' LIMIT 1), '/images/properties/sembalun-2.jpg', false),
((SELECT id FROM properties WHERE slug = 'gili-t-beachfront-estate' LIMIT 1), '/images/properties/gili-1.jpg', true),
((SELECT id FROM properties WHERE slug = 'kuta-surf-lodge' LIMIT 1), '/images/properties/kuta-1.jpg', true);

-- 3. Customers (Sample Leads)
TRUNCATE customers CASCADE;
INSERT INTO customers (full_name, email, phone, priority, lead_status, lead_score, ai_score_reasoning) VALUES 
('Alice Johnson', 'alice@example.com', '+628123456789', 'high', 'new', 90, 'Highly active searching for Sembalun villas, high budget match.'),
('Mark Zuckerberg', 'mark@meta.com', '+1999888777', 'low', 'qualified', 30, 'Looking for island land, but low response frequency.');
