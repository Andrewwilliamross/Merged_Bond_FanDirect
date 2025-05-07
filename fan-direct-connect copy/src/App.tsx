import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import Messaging from "./pages/Messaging";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import FanSignup from "./pages/FanSignup";
import FanAuth from "./pages/FanAuth";
import SubscriptionSettings from "./pages/SubscriptionSettings";
import AdminSettings from "./pages/AdminSettings";
import MacServerSettings from "./pages/MacServerSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import React, { useEffect, useState } from "react";

// Create a new QueryClient instance with aggressive cache-clearing configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Consider all data stale immediately
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes at most (using gcTime instead of cacheTime)
    },
  },
});

function App() {
  // Track if we've already done the domain change check
  const [domainCheckDone, setDomainCheckDone] = useState(false);
  
  // Effect to clear potential stale data on app initialization
  useEffect(() => {
    // Only run this once
    if (domainCheckDone) return;
    
    // Check if this is the first load after domain change
    const lastDomain = localStorage.getItem('app_domain');
    const currentDomain = window.location.hostname;
    const hasQuerryParams = window.location.search.includes('cache_bust');
    
    if (lastDomain && lastDomain !== currentDomain && !hasQuerryParams) {
      console.log('Domain change detected, clearing cache');
      queryClient.clear();
      
      // Some browsers need this to fully clear cache
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    }
    
    // Update stored domain and mark check as done
    localStorage.setItem('app_domain', currentDomain);
    setDomainCheckDone(true);
  }, [domainCheckDone]);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<SignUp />} />
                
                {/* Protected Routes - Note the updated structure */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/messaging" element={<Messaging />} />
                  <Route path="/dashboard/contacts" element={<Contacts />} />
                  <Route path="/dashboard/contacts/:id" element={<Contact />} />
                  <Route path="/dashboard/campaigns" element={<Campaigns />} />
                  <Route path="/dashboard/campaigns/create" element={<CreateCampaign />} />
                  <Route path="/dashboard/analytics" element={<Analytics />} />
                  <Route path="/dashboard/profile" element={<Profile />} />
                  <Route path="/dashboard/subscription" element={<SubscriptionSettings />} />
                  
                  {/* Admin Routes - Add isAdmin check in ProtectedRoute for these */}
                  <Route path="/dashboard/admin" element={<AdminSettings />} />
                  <Route path="/dashboard/admin/mac-servers" element={<MacServerSettings />} />
                </Route>
                
                {/* Fan Routes */}
                <Route path="fan" element={<FanAuth />} />
                <Route path="fan/signup" element={<FanSignup />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
