
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define schema for form validation
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Please enter your name"),
});

type FormData = z.infer<typeof formSchema>;

const FanAuth = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    }
  });

  const handleSignup = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Explicitly set the user metadata with role as a string
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: "fan" // Use string literal to ensure it's a string
          }
        }
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // After successful signup, create subscription
      const tierId = localStorage.getItem('selectedTier');
      const creatorId = localStorage.getItem('selectedCreator');

      if (tierId && creatorId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: subscriptionError } = await supabase
            .from('fan_subscriptions')
            .insert([
              {
                fan_id: user.id,
                creator_id: creatorId,
                tier_id: tierId,
              }
            ]);
            
          if (subscriptionError) {
            console.error("Failed to create subscription:", subscriptionError);
            toast.error("Your account was created but subscription setup failed");
            setIsSubmitting(false);
            navigate('/dashboard');
            return;
          }
        }
      }

      // Clear stored data
      localStorage.removeItem('selectedTier');
      localStorage.removeItem('selectedCreator');

      toast.success('Account created successfully!');
      navigate('/dashboard/subscription');
    } catch (error: any) {
      toast.error('Failed to create account');
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Your Fan Account</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default FanAuth;
