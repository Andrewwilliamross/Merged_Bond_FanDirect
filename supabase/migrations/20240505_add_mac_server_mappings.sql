-- Create mac_server_mappings table
CREATE TABLE IF NOT EXISTS public.mac_server_mappings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    creator_id uuid NOT NULL REFERENCES public.profiles(id),
    server_url text NOT NULL,
    api_key text NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS mac_server_mappings_creator_id_idx ON public.mac_server_mappings(creator_id);
CREATE INDEX IF NOT EXISTS mac_server_mappings_is_default_idx ON public.mac_server_mappings(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.mac_server_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own server mappings"
    ON public.mac_server_mappings FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own server mappings"
    ON public.mac_server_mappings FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own server mappings"
    ON public.mac_server_mappings FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own server mappings"
    ON public.mac_server_mappings FOR DELETE
    USING (auth.uid() = creator_id);

-- Add updated_at trigger
CREATE TRIGGER update_mac_server_mappings_updated_at
    BEFORE UPDATE ON public.mac_server_mappings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to ensure only one default server per creator
CREATE OR REPLACE FUNCTION public.ensure_single_default_server()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Remove default status from other servers for this creator
        UPDATE public.mac_server_mappings
        SET is_default = false
        WHERE creator_id = NEW.creator_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for single default server
CREATE TRIGGER ensure_single_default_server_trigger
    BEFORE INSERT OR UPDATE ON public.mac_server_mappings
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_default_server(); 