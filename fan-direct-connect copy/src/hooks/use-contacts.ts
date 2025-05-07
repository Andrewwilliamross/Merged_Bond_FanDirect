
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

export function useContacts() {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch contacts');
        throw error;
      }

      return data as Contact[];
    },
  });

  const addContact = useMutation({
    mutationFn: async (newContact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to add contacts');
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!newContact.name || newContact.name.trim() === '') {
        toast.error('Contact name is required');
        throw new Error('Contact name is required');
      }

      // Email validation if provided
      if (newContact.email && !/^\S+@\S+\.\S+$/.test(newContact.email)) {
        toast.error('Please enter a valid email address');
        throw new Error('Invalid email format');
      }

      const contactWithOwner = {
        ...newContact,
        owner_id: user.id
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactWithOwner])
        .select()
        .single();

      if (error) {
        toast.error('Failed to add contact');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact added successfully');
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...contact }: Partial<Contact> & { id: string }) => {
      // Validate required fields if they're being updated
      if (contact.name !== undefined && (contact.name === null || contact.name.trim() === '')) {
        toast.error('Contact name is required');
        throw new Error('Contact name is required');
      }

      // Email validation if provided
      if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) {
        toast.error('Please enter a valid email address');
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(contact)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast.error('Failed to update contact');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated successfully');
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete contact');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
  });

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
  };
}
