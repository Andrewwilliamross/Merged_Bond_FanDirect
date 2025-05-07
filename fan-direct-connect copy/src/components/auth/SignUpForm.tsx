
import React from 'react';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import GradientButton from '../GradientButton';

interface SignUpFormProps {
  formData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    instaHandle: string;
  };
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    instaHandle?: string;
  };
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SignUpForm = ({
  formData,
  errors,
  isLoading,
  onChange,
  onSubmit,
}: SignUpFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
          className={errors.name ? 'border-red-300' : ''}
          placeholder="John Smith"
        />
        {errors.name && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{errors.name}</span>
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          className={errors.email ? 'border-red-300' : ''}
          placeholder="name@company.com"
        />
        {errors.email && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={onChange}
            className={errors.password ? 'border-red-300' : ''}
            placeholder="••••••••"
          />
          {errors.password && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{errors.password}</span>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={onChange}
            className={errors.confirmPassword ? 'border-red-300' : ''}
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{errors.confirmPassword}</span>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="instaHandle" className="block text-sm font-medium text-gray-700 mb-1">
          Instagram Handle
        </label>
        <Input
          id="instaHandle"
          name="instaHandle"
          value={formData.instaHandle}
          onChange={onChange}
          className={errors.instaHandle ? 'border-red-300' : ''}
          placeholder="@yourusername"
        />
        {errors.instaHandle && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{errors.instaHandle}</span>
          </div>
        )}
      </div>
      
      <div>
        <GradientButton
          type="submit"
          className="w-full py-3 mt-2"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </GradientButton>
      </div>
    </form>
  );
};

export default SignUpForm;
