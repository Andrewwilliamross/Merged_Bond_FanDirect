
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, MessageSquare, ListChecks, BarChart, User, Settings, Server, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

function Sidebar({ isMobile, onClose }: SidebarProps = {}) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const isDefaultMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true); // Set default to true for better visibility
  const navigate = useNavigate();
  
  // Use the provided isMobile prop if available, otherwise use the hook result
  const isMobileView = isMobile !== undefined ? isMobile : isDefaultMobile;

  // Check if user is an admin (using proper role-based system)
  const isAdmin = profile?.role === 'admin';

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Determine sidebar visibility classes
  const sidebarClasses = `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
    ${isMobileView ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
    bg-white shadow-xl flex flex-col`;

  return (
    <aside className={sidebarClasses}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-lg font-semibold">Lovable.</span>
        {isMobileView && (
          <button onClick={onClose || toggleSidebar} className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
              }
              end
            >
              <Home className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/messaging"
              className={({ isActive }) =>
                `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
              }
            >
              <MessageSquare className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span>Messaging</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/contacts"
              className={({ isActive }) =>
                `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
              }
            >
              <Users className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span>Contacts</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/campaigns"
              className={({ isActive }) =>
                `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
              }
            >
              <ListChecks className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span>Campaigns</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/analytics"
              className={({ isActive }) =>
                `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
              }
            >
              <BarChart className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span>Analytics</span>
            </NavLink>
          </li>
          
          {/* Admin section - only shown to admin users */}
          {isAdmin && (
            <>
              <li className="pt-4">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ADMIN
                </h3>
              </li>
              <li>
                <NavLink
                  to="/dashboard/admin"
                  className={({ isActive }) =>
                    `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <Settings className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
                  <span>Settings</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/admin/mac-servers"
                  className={({ isActive }) =>
                    `${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`
                  }
                >
                  <Server className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
                  <span>Mac Servers</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      {/* Sidebar Footer */}
      <div className="py-3 px-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left truncate">{profile?.full_name || user?.email}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/subscription')}>
              Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default Sidebar;
