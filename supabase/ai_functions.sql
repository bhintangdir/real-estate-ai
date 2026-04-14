-- COMPLETE AI INFRASTRUCTURE & REPAIR SCRIPT
-- Run this in Supabase SQL Editor to enable all AI Brain features

-- 1. Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ensure all necessary AI columns exist on the customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lead_score int DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_score_reasoning text;

-- 3. Create or Update the Semantic Search logic
CREATE OR REPLACE FUNCTION match_customers (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  whatsapp_number text,
  priority text,
  lead_status text,
  lead_score int,
  ai_score_reasoning text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    customers.id,
    customers.full_name,
    customers.email,
    customers.phone,
    customers.whatsapp_number,
    customers.priority,
    customers.lead_status,
    customers.lead_score,
    customers.ai_score_reasoning,
    (1 - (customers.embedding <=> query_embedding))::float AS similarity
  FROM customers
  WHERE customers.embedding IS NOT NULL
    AND (1 - (customers.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
