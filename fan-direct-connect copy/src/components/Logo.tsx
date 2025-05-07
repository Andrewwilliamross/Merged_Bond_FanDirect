
import React from 'react';
import { MessageSquare } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-12 h-12 flex items-center justify-center bg-gradient-brand rounded-xl">
        <MessageSquare className="text-white h-8 w-8" />
      </div>
      <span className="font-display text-2xl font-bold text-brand-darkgray">Contact™</span>
    </div>
  );
};

export default Logo;
