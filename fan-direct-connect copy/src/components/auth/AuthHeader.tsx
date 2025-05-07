
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <div className="text-center">
      <Link to="/" className="inline-block">
        <Logo />
      </Link>
      <h2 className="mt-6 text-3xl font-display font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  );
};

export default AuthHeader;
