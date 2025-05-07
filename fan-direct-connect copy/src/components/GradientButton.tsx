
import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const GradientButton = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  ...props 
}: GradientButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-lg font-display font-semibold transition-all hover:opacity-90',
        {
          'bg-gradient-brand text-white': variant === 'primary',
          'border-2 border-brand-blue text-brand-blue hover:bg-blue-50': variant === 'outline',
          'text-brand-blue hover:bg-gray-100': variant === 'ghost',
          'text-sm px-4 py-2': size === 'sm',
          'text-base px-6 py-3': size === 'md',
          'text-lg px-8 py-4': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default GradientButton;
