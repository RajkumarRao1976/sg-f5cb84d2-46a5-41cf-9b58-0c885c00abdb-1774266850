-- Create licenses table with all required fields
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  software_name TEXT NOT NULL,
  category TEXT NOT NULL,
  custom_category TEXT,
  platform TEXT,
  license_type TEXT NOT NULL CHECK (license_type IN ('Perpetual', 'Subscription')),
  license_key TEXT,
  username TEXT,
  password TEXT,
  download_url TEXT,
  purchase_date DATE NOT NULL,
  renewal_date DATE,
  renewal_alarm_days INTEGER,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EURO', 'INR')),
  price_in_inr NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies - T1 (Private user data)
CREATE POLICY "select_own_licenses" ON public.licenses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_licenses" ON public.licenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_licenses" ON public.licenses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "delete_own_licenses" ON public.licenses 
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX idx_licenses_renewal_date ON public.licenses(renewal_date);

-- Add notification_email and email_verified to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_secret TEXT;