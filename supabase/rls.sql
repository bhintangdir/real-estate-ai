-- Row Level Security (RLS) Policies (Idempotent Version)

-- 1. Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- 2. Profiles
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Property & Categories
DROP POLICY IF EXISTS "Anyone can view categories" ON property_categories;
DROP POLICY IF EXISTS "Manage categories" ON property_categories;
CREATE POLICY "Anyone can view categories" ON property_categories FOR SELECT USING (true);
CREATE POLICY "Manage categories" ON property_categories FOR ALL USING (authorize('page:settings:view'));

DROP POLICY IF EXISTS "View properties" ON properties;
DROP POLICY IF EXISTS "Create properties" ON properties;
DROP POLICY IF EXISTS "Edit properties" ON properties;
DROP POLICY IF EXISTS "Delete properties" ON properties;

CREATE POLICY "View properties" ON properties FOR SELECT USING (true); -- Izinkan view semua (filter tetap dilakukan di level query aplikasi)
CREATE POLICY "Create properties" ON properties FOR INSERT WITH CHECK (authorize('page:properties:create') OR auth.role() = 'authenticated');
CREATE POLICY "Edit properties" ON properties FOR UPDATE USING (authorize('page:properties:edit') OR auth.role() = 'authenticated');
CREATE POLICY "Delete properties" ON properties FOR DELETE USING (authorize('page:properties:delete') OR auth.role() = 'authenticated');

-- 3.1 Property Images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
DROP POLICY IF EXISTS "Staff can manage property images" ON property_images;
CREATE POLICY "Anyone can view property images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Staff can manage property images" ON property_images FOR ALL USING (authorize('page:properties:edit') OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage docs" ON property_documents;
CREATE POLICY "Manage docs" ON property_documents FOR ALL USING (authorize('page:properties:edit'));

-- 4. CRM
DROP POLICY IF EXISTS "View assigned or all customers" ON customers;
DROP POLICY IF EXISTS "Create customers" ON customers;
DROP POLICY IF EXISTS "Edit customers" ON customers;
CREATE POLICY "View assigned or all customers" ON customers 
    FOR SELECT USING (authorize('page:customers:manage_all') OR auth.uid() = assigned_agent_id);
CREATE POLICY "Create customers" ON customers FOR INSERT WITH CHECK (authorize('page:customers:create'));
CREATE POLICY "Edit customers" ON customers FOR UPDATE USING (authorize('page:customers:edit') OR auth.uid() = assigned_agent_id);

-- 5. AI & Market Trends
DROP POLICY IF EXISTS "View market trends" ON market_trends;
CREATE POLICY "View market trends" ON market_trends FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage AI agents" ON ai_agents;
CREATE POLICY "Manage AI agents" ON ai_agents FOR ALL USING (authorize('page:ai:manage'));

DROP POLICY IF EXISTS "Knowledge base read access" ON knowledge_base;
CREATE POLICY "Knowledge base read access" ON knowledge_base FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage AI tasks" ON ai_tasks;
CREATE POLICY "Manage AI tasks" ON ai_tasks FOR ALL USING (authorize('page:ai:manage'));

DROP POLICY IF EXISTS "View AI logs" ON ai_logs;
CREATE POLICY "View AI logs" ON ai_logs FOR SELECT USING (authorize('page:ai:manage'));

-- 6. Operations
DROP POLICY IF EXISTS "View assigned tasks" ON employee_tasks;
DROP POLICY IF EXISTS "Manage tasks" ON employee_tasks;
CREATE POLICY "View assigned tasks" ON employee_tasks FOR SELECT USING (auth.uid() = assigned_to OR authorize('page:tasks:manage'));
CREATE POLICY "Manage tasks" ON employee_tasks FOR ALL USING (authorize('page:tasks:manage'));

DROP POLICY IF EXISTS "View surveys" ON survey_schedules;
DROP POLICY IF EXISTS "Manage surveys" ON survey_schedules;
CREATE POLICY "View surveys" ON survey_schedules FOR SELECT USING (true);
CREATE POLICY "Manage surveys" ON survey_schedules FOR ALL USING (authorize('page:properties:edit'));

-- 7. Messaging
DROP POLICY IF EXISTS "View chat channels" ON chat_channels;
CREATE POLICY "View chat channels" ON chat_channels FOR ALL USING (authorize('page:communication:view'));

DROP POLICY IF EXISTS "View chat messages" ON chat_messages;
CREATE POLICY "View chat messages" ON chat_messages FOR ALL USING (authorize('page:communication:view'));

-- 8. Finance
DROP POLICY IF EXISTS "View invoices" ON invoices;
DROP POLICY IF EXISTS "Manage invoices" ON invoices;
CREATE POLICY "View invoices" ON invoices FOR SELECT USING (authorize('page:finance:view') OR EXISTS (SELECT 1 FROM customers WHERE id = invoices.customer_id AND assigned_agent_id = auth.uid()));
CREATE POLICY "Manage invoices" ON invoices FOR ALL USING (authorize('page:finance:manage'));

DROP POLICY IF EXISTS "Manage payments" ON payments;
CREATE POLICY "Manage payments" ON payments FOR ALL USING (authorize('page:finance:manage'));

-- 9. System
DROP POLICY IF EXISTS "View own notifications" ON notifications;
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see audit logs" ON audit_logs;
CREATE POLICY "Admins see audit logs" ON audit_logs FOR SELECT USING (authorize('page:audit:view'));

DROP POLICY IF EXISTS "Anyone can view settings" ON general_settings;
DROP POLICY IF EXISTS "Only superuser can update settings" ON general_settings;
CREATE POLICY "Anyone can view settings" ON general_settings FOR SELECT USING (true);
CREATE POLICY "Only superuser can update settings" ON general_settings FOR UPDATE USING (authorize('page:settings:view'));

-- 10. Roles & Storage
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
CREATE POLICY "Roles are viewable by authenticated users" ON roles FOR SELECT USING (auth.role() = 'authenticated');

-- Storage Policies for Avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Manage own avatar" ON storage.objects;

CREATE POLICY "Manage own avatar" ON storage.objects FOR ALL 
USING (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = split_part(name, '.', 1))
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (auth.uid()::text = split_part(name, '.', 1))
);

-- Properties Bucket (Villa Images)
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'properties');

DROP POLICY IF EXISTS "Staff can manage property images" ON storage.objects;
CREATE POLICY "Staff can manage property images" ON storage.objects FOR ALL 
USING (
  bucket_id = 'properties' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.name IN ('superuser', 'manager', 'admin', 'agent')
  ))
);

-- Documents Bucket (Legal Docs - PRIVATE)
DROP POLICY IF EXISTS "Only staff can view legal documents" ON storage.objects;
CREATE POLICY "Only staff can view legal documents" ON storage.objects FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.name IN ('superuser', 'manager', 'admin', 'agent')
  ))
);

DROP POLICY IF EXISTS "Only executive staff can manage legal documents" ON storage.objects;
CREATE POLICY "Only executive staff can manage legal documents" ON storage.objects FOR ALL 
USING (
  bucket_id = 'documents' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() 
    AND r.name IN ('superuser', 'manager', 'admin')
  ))
);
