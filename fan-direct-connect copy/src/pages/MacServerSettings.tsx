import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Check, Trash2, PlusCircle, RefreshCw } from 'lucide-react';

interface MacServerMapping {
  id: string;
  creator_id: string;
  server_url: string;
  api_key: string | null;
  is_default: boolean;
}

const MacServerSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerApiKey, setNewServerApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch existing Mac server mappings
  const { data: mappings, isLoading, isError } = useQuery({
    queryKey: ['mac-server-mappings'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('mac_server_mappings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Test the connection to a Mac server
  const testServerConnection = async (serverUrl: string, apiKey: string) => {
    try {
      toast.loading('Testing connection to Mac server...');
      
      // Make a simple request to the Mac server to check if it's accessible
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      toast.success('Connection successful!');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Add a new Mac server mapping
  const addMacServerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      if (!newServerUrl.trim()) {
        throw new Error('Server URL is required');
      }
      
      // Check if making this server default and there's already a default
      if (isDefault) {
        const { data: existingDefault } = await supabase
          .from('mac_server_mappings')
          .select('id')
          .eq('is_default', true)
          .single();
          
        if (existingDefault) {
          // Remove default status from existing default
          await supabase
            .from('mac_server_mappings')
            .update({ is_default: false })
            .eq('id', existingDefault.id);
        }
      }
      
      // Create the new mapping
      const { data, error } = await supabase
        .from('mac_server_mappings')
        .insert({
          creator_id: user.id,
          server_url: newServerUrl.trim(),
          api_key: newServerApiKey.trim() || null,
          is_default: isDefault
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mac-server-mappings'] });
      setNewServerUrl('');
      setNewServerApiKey('');
      setIsDefault(false);
      toast.success('Mac server added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add Mac server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete a Mac server mapping
  const deleteMacServerMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('mac_server_mappings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mac-server-mappings'] });
      toast.success('Mac server removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove Mac server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Set a server as the default
  const setDefaultMacServerMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // First unset any existing default
      await supabase
        .from('mac_server_mappings')
        .update({ is_default: false })
        .eq('is_default', true);
        
      // Then set the new default
      const { error } = await supabase
        .from('mac_server_mappings')
        .update({ is_default: true })
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mac-server-mappings'] });
      toast.success('Default Mac server updated');
    },
    onError: (error) => {
      toast.error(`Failed to update default Mac server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return (
    <DashboardLayout title="Mac Server Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mac Server Configuration</CardTitle>
            <CardDescription>
              Configure Mac servers for message delivery. Each server must implement the Mac Server API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Server Form */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Add New Mac Server</h3>
              
              <div className="space-y-2">
                <FormLabel htmlFor="server-url">Server URL</FormLabel>
                <Input 
                  id="server-url"
                  placeholder="https://your-mac-server.example.com/api/messages"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="server-api-key">API Key</FormLabel>
                <Input 
                  id="server-api-key"
                  type="password"
                  placeholder="Optional: API key for server authentication"
                  value={newServerApiKey}
                  onChange={(e) => setNewServerApiKey(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <FormLabel htmlFor="is-default">Set as default server</FormLabel>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => addMacServerMutation.mutate()}
                  disabled={!newServerUrl.trim() || addMacServerMutation.isPending}
                >
                  {addMacServerMutation.isPending ? 
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : 
                    <PlusCircle className="h-4 w-4 mr-2" />
                  }
                  Add Server
                </Button>
                
                {newServerUrl && newServerApiKey && (
                  <Button 
                    variant="outline"
                    onClick={() => testServerConnection(newServerUrl, newServerApiKey)}
                    disabled={!newServerUrl.trim()}
                  >
                    Test Connection
                  </Button>
                )}
              </div>
            </div>
            
            {/* Existing Servers */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Mac Servers</h3>
              
              {isLoading ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading servers...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-4 text-red-500">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>Failed to load Mac servers</p>
                </div>
              ) : mappings && mappings.length > 0 ? (
                <div className="space-y-4">
                  {mappings.map((server: MacServerMapping) => (
                    <div key={server.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center">
                          {server.server_url}
                          {server.is_default && (
                            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {server.api_key ? "API Key: ••••••••" : "No API Key"}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!server.is_default && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDefaultMacServerMutation.mutate(server.id)}
                            disabled={setDefaultMacServerMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Set Default
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteMacServerMutation.mutate(server.id)}
                          disabled={deleteMacServerMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">No Mac servers configured</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a Mac server to enable message delivery
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-sm text-gray-500">
              Mac servers receive outbound messages and deliver them via iMessage
            </p>
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['mac-server-mappings'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MacServerSettings;
