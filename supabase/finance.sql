-- PHASE 6: OPERATIONAL & FINANCIAL SCHEMA
-- Enabling Property Surveys and Billing

-- 1. PROPERTY SURVEYS (Connecting Customers to Properties)
CREATE TABLE IF NOT EXISTS property_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  survey_date timestamp with time zone NOT NULL,
  status text DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'cancelled'
  notes text,
  staff_id uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. INVOICES (Billing Management)
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  status text DEFAULT 'draft', -- 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  due_date date NOT NULL,
  items jsonb DEFAULT '[]'::jsonb, -- Array of items {description, quantity, price}
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Allow authenticated users to manage surveys" ON property_surveys
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage invoices" ON invoices
FOR ALL USING (auth.role() = 'authenticated');

-- Function to generate invoice numbers randomly (simplified)
CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS trigger AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();
