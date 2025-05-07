
import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut, user } = useAuth();
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity" 
             onClick={() => setSidebarOpen(false)} 
             aria-hidden="true">
        </div>
      )}
      
      {/* Mobile sidebar */}
      {isMobile && (
        <div className={`fixed inset-y-0 left-0 z-50 transition-transform transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar isMobile={true} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
      
      {/* Desktop sidebar - always visible */}
      {!isMobile && (
        <div className="hidden md:block md:w-64 md:flex-none md:fixed md:inset-y-0">
          <Sidebar />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-64">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <h1 className="ml-3 text-xl md:text-2xl font-display font-bold text-gray-900 truncate">{title}</h1>
            </div>
            
            <div className="flex items-center">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-gradient-brand text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block ml-2 text-sm font-medium">
                    {profile?.full_name || user?.email || "User"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden">
          <div className="py-6 px-4 sm:px-6 md:px-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
