import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/utils';

export function useSubscription<T extends keyof Tables>(
  table: T,
  callback: (payload: {
    new: Tables[T]['Row'] | null;
    old: Tables[T]['Row'] | null;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  }) => void,
  filter?: string
) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
          filter,
        },
        (payload) => {
          callback(payload as any);
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, filter]);

  return isSubscribed;
} 