-- Storage Bucket Initialization
-- Run this in Supabase SQL Editor to set up storage containers

-- 1. Create 'avatars' bucket for user profiles
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'properties' bucket for villa/land images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create 'documents' bucket for legal documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Note: Policies for these buckets are defined in rls.sql
