
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Bell } from 'lucide-react';

const AdminSettings = () => {
  const navigate = useNavigate();
  
  const settings = [
    {
      title: 'Messaging Settings',
      description: 'Configure templates and messaging preferences',
      icon: MessageSquare,
      path: '/dashboard/admin/messaging-settings',
    },
    {
      title: 'User Management',
      description: 'Manage user access and permissions',
      icon: Users,
      path: '/dashboard/admin/users',
    },
    {
      title: 'Notification Settings',
      description: 'Configure notifications and alerts',
      icon: Bell,
      path: '/dashboard/admin/notifications',
    },
  ];
  
  return (
    <DashboardLayout title="Admin Settings">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <Card key={setting.title} className="overflow-hidden">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <setting.icon className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-lg">{setting.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardDescription className="text-base">{setting.description}</CardDescription>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t py-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate(setting.path)}
              >
                Configure
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
