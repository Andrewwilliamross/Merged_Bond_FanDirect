
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  tier_id: string;
  creator_id: string;
  status: string;
  created_at: string;
  tier: {
    name: string;
    price: number;
    description: string | null;
  };
  creator: {
    full_name: string;
  };
}

export function useFanSubscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['fan-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // First, get the fan subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('fan_subscriptions')
        .select(`
          *,
          tier:subscription_tiers(name, price, description)
        `)
        .eq('fan_id', user.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') throw subscriptionError;
      if (!subscriptionData) return null;

      // Then, separately fetch the creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', subscriptionData.creator_id)
        .single();

      if (creatorError) throw creatorError;

      // Combine the data
      const result: Subscription = {
        ...subscriptionData,
        tier: subscriptionData.tier as Subscription['tier'],
        creator: creatorData as Subscription['creator']
      };

      return result;
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('fan_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-subscription'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel subscription');
    },
  });

  return {
    subscription,
    isLoading,
    cancelSubscription,
  };
}
