-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
    BEFORE UPDATE ON public.subscription_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle campaign status changes
CREATE OR REPLACE FUNCTION public.handle_campaign_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only handle status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Update campaign stats when status changes to 'completed'
        IF NEW.status = 'completed' THEN
            NEW.stats = jsonb_set(
                COALESCE(NEW.stats, '{}'::jsonb),
                '{completed_at}',
                to_jsonb(timezone('utc'::text, now()))
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add campaign status change trigger
CREATE TRIGGER handle_campaign_status_changes
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_campaign_status_change();

-- Function to handle subscription changes
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When a profile's subscribed_to changes
    IF TG_OP = 'UPDATE' AND OLD.subscribed_to IS DISTINCT FROM NEW.subscribed_to THEN
        -- You could add additional logic here, like:
        -- - Recording subscription history
        -- - Updating subscriber counts
        -- - Triggering notifications
        NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add subscription change trigger
CREATE TRIGGER handle_subscription_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_subscription_change();

-- Function to validate campaign scheduling
CREATE OR REPLACE FUNCTION public.validate_campaign_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure scheduled_for is in the future for new campaigns
    IF TG_OP = 'INSERT' AND NEW.scheduled_for <= timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Campaign must be scheduled for a future date';
    END IF;
    
    -- For updates, only check if scheduled_for is being changed
    IF TG_OP = 'UPDATE' AND 
       OLD.scheduled_for IS DISTINCT FROM NEW.scheduled_for AND
       NEW.scheduled_for <= timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Campaign must be scheduled for a future date';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add campaign schedule validation trigger
CREATE TRIGGER validate_campaign_schedule
    BEFORE INSERT OR UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_campaign_schedule(); 