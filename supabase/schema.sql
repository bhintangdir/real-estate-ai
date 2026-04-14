-- ULTIMATE REAL ESTATE AI ENGINE
-- Version: 5.1 (The Fully Complete 10/10)

-- 0. Enable Extensions & Global Settings
CREATE EXTENSION IF NOT EXISTS vector; 
SET timezone = 'UTC';

-- 1. RBAC (Role Based Access Control)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. Profiles (Extended with Communication IDs)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    phone TEXT,
    whatsapp_number TEXT,
    telegram_id TEXT,
    agency_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Properties & Categories (Deep Metadata)
CREATE TABLE property_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES property_categories(id),
    ai_valuation JSONB DEFAULT '{}'::jsonb,
    listing_type TEXT CHECK (listing_type IN ('sale', 'rent')),
    price NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    location TEXT,
    city TEXT,
    address TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    marketing_copy JSONB DEFAULT '{}'::jsonb, -- Untuk SEO Title, Social Captions, dll
    main_image TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'archived')),
    agent_id UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. Property Images (Multi-upload Support)
CREATE TABLE property_images (
    id SERIAL PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Property Documents (AI Audit Support)
CREATE TABLE property_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    ai_audit_notes TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. CRM (Full Lead Detail & AI Scoring)
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    telegram_id TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    lead_status TEXT DEFAULT 'new',
    
    -- AI Scoring & Logic
    lead_score INTEGER DEFAULT 0,
    ai_score_reasoning TEXT,
    
    -- Needs & Requirements (The missing columns)
    target_budget_min NUMERIC(15, 2),
    target_budget_max NUMERIC(15, 2),
    preferred_cities TEXT[],
    preferred_categories INTEGER[], -- array of category IDs
    notes TEXT,
    
    referred_by UUID REFERENCES profiles(id),
    assigned_agent_id UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. Autonomous AI Infrastructure
CREATE TABLE knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role_description TEXT,
    system_prompt TEXT,
    capabilities TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES ai_agents(id),
    target_customer_id UUID REFERENCES customers(id),
    task_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    input_data JSONB,
    output_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Operational Management
CREATE TABLE employee_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id),
    related_customer_id UUID REFERENCES customers(id),
    related_property_id UUID REFERENCES properties(id),
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    ai_generated BOOLEAN DEFAULT false,
    ai_reasoning TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE survey_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES profiles(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled',
    is_ai_coordinated BOOLEAN DEFAULT false,
    feedback_from_customer TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. Chat & Messaging Channels
CREATE TABLE chat_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_chat_id TEXT NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id),
    role TEXT CHECK (role IN ('customer', 'agent', 'bot')),
    content TEXT,
    media_url TEXT,
    message_type TEXT DEFAULT 'text',
    external_id TEXT,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Finance & Payments
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'unpaid',
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Audit & Performance
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    channels TEXT[] DEFAULT '{in_app}',
    is_read BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Market Analysis (For AI Trends)
CREATE TABLE market_trends (
    id BIGSERIAL PRIMARY KEY,
    region TEXT NOT NULL,
    property_type_id INTEGER REFERENCES property_categories(id),
    avg_price_psm NUMERIC(15, 2),
    total_listings INTEGER,
    demand_index REAL, -- 0.0 to 1.0 AI generated
    analysis_date DATE DEFAULT CURRENT_DATE,
    ai_summary TEXT
);

-- 12. Wishlists (Buyer Preferences)
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, property_id)
);

-- 13. General Settings
CREATE TABLE general_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. PERFOMANCE INDEXES
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_customers_lead_status ON customers(lead_status);
CREATE INDEX idx_customers_lead_score ON customers(lead_score DESC);
CREATE INDEX idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_l2_ops);

-- 14. SYTEM FUNCTIONS
CREATE OR REPLACE FUNCTION public.authorize(requested_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id INTEGER;
BEGIN
  -- Ambil role_id dari profil user yang sedang login
  SELECT role_id INTO user_role_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- Cek apakah role tersebut memiliki permisi yang diminta
  RETURN EXISTS (
    SELECT 1 
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = user_role_id
    AND p.name = requested_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION match_knowledge(query_embedding VECTOR(1536), match_count INT)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY SELECT kb.id, kb.content, kb.metadata, 1 - (kb.embedding <=> query_embedding) AS similarity FROM knowledge_base kb ORDER BY similarity DESC LIMIT match_count;
END; $$;

-- 14. AUTH TRIGGER (Automatically create profile on signup)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role_id)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    new.email, 
    (SELECT id FROM public.roles WHERE name = COALESCE(new.raw_user_meta_data->>'role', 'client'))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
-- 14. STORAGE SETTINGS (Reference only)
-- Note: Commands below are usually run in SQL Editor for storage bucket initialization
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
