
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Phone, UserRound, MapPin, Upload, Edit } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        avatarUrl: profile.avatar_url || '',
      });
    }
  }, [profile, user]);

  // Handle profile picture upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        setIsLoading(true);
        // Create a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        const avatarUrl = data.publicUrl;
        
        // Update local state
        setEditedProfile({ ...editedProfile, avatarUrl });
        
        toast.success('Avatar uploaded successfully');
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        toast.error(`Failed to upload avatar: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle edit mode toggle
  const toggleEditMode = async () => {
    if (isEditing) {
      // Save changes
      try {
        setIsLoading(true);
        
        if (!user || !user.id) {
          toast.error("User not authenticated");
          setIsEditing(false);
          return;
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: editedProfile.name,
            phone: editedProfile.phone,
            location: editedProfile.location,
            avatar_url: editedProfile.avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) throw error;
        
        await refreshProfile();
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast.error(`Failed to update profile: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Enter edit mode with current values
      setEditedProfile({
        name: profile?.full_name || '',
        email: user?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        avatarUrl: profile?.avatar_url || '',
      });
      setIsEditing(true);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile({ ...editedProfile, [name]: value });
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-3xl mx-auto p-4 md:p-0 space-y-6">
        <Card>
          <CardHeader className="flex flex-col items-center gap-4 pb-8">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={isEditing ? editedProfile.avatarUrl : profile?.avatar_url} 
                  alt={profile?.full_name} 
                />
                <AvatarFallback className="text-3xl">
                  {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button 
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-brand text-white"
                  disabled={isLoading}
                >
                  <Upload className="h-5 w-5" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </button>
              )}
            </div>
            <div className="text-center">
              {isEditing ? (
                <Input
                  name="name"
                  value={editedProfile.name}
                  onChange={handleInputChange}
                  className="text-center text-lg font-bold"
                />
              ) : (
                <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
              )}
              <p className="text-sm text-muted-foreground">Creator @</p>
            </div>
            <Button 
              onClick={toggleEditMode}
              variant="outline"
              className="mt-2 flex items-center gap-2"
              disabled={isLoading}
            >
              <Edit className="h-4 w-4" />
              {isLoading ? "Processing..." : (isEditing ? "Save Changes" : "Edit Profile")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={editedProfile.phone || ''}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="font-medium">{profile?.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <div className="p-2 rounded-full bg-orange-100">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  {isEditing ? (
                    <Input
                      name="location"
                      value={editedProfile.location || ''}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="font-medium">{profile?.location || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
