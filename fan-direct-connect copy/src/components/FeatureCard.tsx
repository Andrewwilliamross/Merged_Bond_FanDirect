
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  align?: 'left' | 'right';
  bgColor?: string;
}

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  className, 
  align = 'left', 
  bgColor 
}: FeatureCardProps) => {
  return (
    <div className={cn(
      "flex",
      align === 'right' ? 'justify-end' : 'justify-start',
      className
    )}>
      <div
        className={cn(
          "max-w-md rounded-2xl px-6 py-4",
          align === 'right'
            ? (bgColor || 'bg-gradient-brand') + ' text-white rounded-br-none'
            : 'bg-brand-lightgray rounded-bl-none'
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <h3 className={cn(
            "font-display text-2xl font-medium",
            align === 'right' ? 'text-white' : 'text-gradient'
          )}>
            {title}
          </h3>
          <Icon className={cn(
            "h-6 w-6",
            align === 'right' ? 'text-white' : 'text-brand-purple'
          )} />
        </div>
        <p className={cn(
          "font-sans text-base",
          align === 'right' ? 'text-white/90' : 'text-gray-800'
        )}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
