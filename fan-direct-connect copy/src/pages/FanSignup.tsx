
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

const FanSignup = () => {
  const { creatorId } = useParams();
  const navigate = useNavigate();

  const { data: creator, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['subscription-tiers', creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('creator_id', creatorId)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as SubscriptionTier[];
    },
  });

  const handleSubscribe = async (tierId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Save selected tier and redirect to signup
        localStorage.setItem('selectedTier', tierId);
        localStorage.setItem('selectedCreator', creatorId!);
        navigate('/fan-auth');
        return;
      }

      // User is logged in, create subscription
      const { error } = await supabase
        .from('fan_subscriptions')
        .insert([
          {
            fan_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
          }
        ]);

      if (error) throw error;

      toast.success('Successfully subscribed!');
      navigate('/dashboard/subscription');
    } catch (error) {
      toast.error('Failed to subscribe');
      console.error('Subscription error:', error);
    }
  };

  if (isLoadingCreator || isLoadingTiers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
        <div className="container mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Subscribe to {creator?.full_name}
        </h1>
        
        {tiers && tiers.length === 0 ? (
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <p className="text-lg text-gray-600">This creator hasn't set up any subscription tiers yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {tiers?.map((tier) => (
              <Card key={tier.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-semibold mb-2">{tier.name}</h2>
                <p className="text-3xl font-bold mb-4 text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${tier.price}</p>
                {tier.description && (
                  <p className="text-gray-600 mb-6">{tier.description}</p>
                )}
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => handleSubscribe(tier.id)}
                >
                  Subscribe
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FanSignup;
