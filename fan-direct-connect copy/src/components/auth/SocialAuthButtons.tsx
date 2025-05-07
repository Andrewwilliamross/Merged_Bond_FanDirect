
import React from 'react';
import { Instagram } from 'lucide-react';

interface SocialAuthButtonsProps {
  onSocialAuth: (provider: 'instagram' | 'tiktok') => void;
}

const SocialAuthButtons = ({ onSocialAuth }: SocialAuthButtonsProps) => {
  return (
    <div className="space-y-4">
      <button
        onClick={() => onSocialAuth('instagram')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Instagram className="h-5 w-5 text-[#E4405F]" />
        Continue with Instagram
      </button>
      
      <button
        onClick={() => onSocialAuth('tiktok')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.001-.104z"/>
        </svg>
        Continue with TikTok
      </button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
