
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  description: z.string().optional(),
});

interface SubscriptionTierFormProps {
  tier?: {
    id: string;
    name: string;
    price: number;
    description: string | null;
  } | null;
  onSuccess: () => void;
}

const SubscriptionTierForm = ({ tier, onSuccess }: SubscriptionTierFormProps) => {
  const { user, loading } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tier?.name || "",
      price: tier?.price?.toString() || "",
      description: tier?.description || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('Authentication error. Please try logging in again.');
      return;
    }

    try {
      const data = {
        name: values.name,
        price: Number(values.price),
        description: values.description || null,
        creator_id: user.id
      };

      if (tier) {
        // Update existing tier
        const { error } = await supabase
          .from('subscription_tiers')
          .update(data)
          .eq('id', tier.id);

        if (error) {
          toast.error('Failed to update tier: ' + error.message);
          console.error('Update error:', error);
          return;
        }
        
        toast.success('Tier updated successfully');
      } else {
        // Create new tier - use array format for insert
        const { error } = await supabase
          .from('subscription_tiers')
          .insert([data]);

        if (error) {
          toast.error('Failed to create tier: ' + error.message);
          console.error('Insert error:', error);
          return;
        }
        
        toast.success('Tier created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred: ' + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Premium Tier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (USD)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="9.99" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the benefits of this tier..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {tier ? 'Update Tier' : 'Create Tier'}
        </Button>
      </form>
    </Form>
  );
};

export default SubscriptionTierForm;
