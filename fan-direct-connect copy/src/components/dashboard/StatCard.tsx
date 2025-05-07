
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change: string;
  positive: boolean;
}

const StatCard = ({ title, value, icon: Icon, change, positive }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{title}</span>
        <Icon className={`h-5 w-5 ${positive ? 'text-green-500' : 'text-red-500'}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold mb-1">{value}</span>
        <span className={`text-xs ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
