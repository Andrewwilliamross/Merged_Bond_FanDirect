-- Create the fan_creator_mappings table
CREATE TABLE IF NOT EXISTS public.fan_creator_mappings (
    id BIGSERIAL PRIMARY KEY,
    fan_phone_number TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on phone numbers and creator_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_fan_phone_number ON public.fan_creator_mappings(fan_phone_number);
CREATE INDEX IF NOT EXISTS idx_creator_id ON public.fan_creator_mappings(creator_id);

-- Add a unique constraint to prevent duplicate mappings
ALTER TABLE public.fan_creator_mappings 
ADD CONSTRAINT unique_fan_creator_mapping 
UNIQUE (fan_phone_number, creator_id); 