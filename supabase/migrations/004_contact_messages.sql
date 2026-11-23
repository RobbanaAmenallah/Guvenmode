-- Migration 004: Contact Messages Table for Güven Mode Conciergerie
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'replied'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick sorting and searching
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public and anonymous users to insert new contact inquiries
DROP POLICY IF EXISTS "Public can insert contact_messages" ON public.contact_messages;
CREATE POLICY "Public can insert contact_messages" ON public.contact_messages
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow authenticated admins to view and manage all contact inquiries
DROP POLICY IF EXISTS "Admins full access to contact_messages" ON public.contact_messages;
CREATE POLICY "Admins full access to contact_messages" ON public.contact_messages
    FOR ALL TO authenticated USING (public.is_admin());
