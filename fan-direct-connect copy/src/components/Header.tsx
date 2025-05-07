
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import GradientButton from './GradientButton';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="w-full py-4 px-4 md:px-8 bg-white/85 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="no-underline">
          <Logo />
        </Link>
        
        {user ? (
          // Show dashboard link if user is logged in
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="font-display font-semibold text-lg hover:text-brand-blue transition-colors">
              Dashboard
            </Link>
          </div>
        ) : (
          // Show login/signup links if user is not logged in
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/login" className="font-display font-semibold text-lg hover:text-brand-blue transition-colors">
              Log In
            </Link>
            <Link to="/signup">
              <GradientButton>Sign Up</GradientButton>
            </Link>
          </div>
        )}
        
        <div className="md:hidden flex items-center">
          {user ? (
            <Link to="/dashboard">
              <GradientButton size="sm">Dashboard</GradientButton>
            </Link>
          ) : (
            <Link to="/login">
              <GradientButton size="sm">Log In</GradientButton>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
