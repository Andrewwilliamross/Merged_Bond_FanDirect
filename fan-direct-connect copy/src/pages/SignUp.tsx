import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthHeader from '../components/auth/AuthHeader';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';
import SignUpForm from '../components/auth/SignUpForm';
import AnimatedPlane from '../components/AnimatedPlane';
import { useAuth } from '@/contexts/AuthContext';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instaHandle: '',
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    instaHandle?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, user } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.instaHandle.trim()) {
      newErrors.instaHandle = 'Instagram handle is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSocialAuth = (provider: 'instagram' | 'tiktok') => {
    toast.info(`${provider} authentication coming soon!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const userData = {
      full_name: formData.name,
      instagram_handle: formData.instaHandle,
      role: 'creator' // Explicitly setting the role to creator
    };

    try {
      const { error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message || 'Failed to create account');
        setIsLoading(false);
        return;
      }
      
      // Note: toast and navigation are now handled in the signUp function
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast.error('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <AnimatedPlane />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <AuthHeader 
            title="Create your account"
            subtitle="Start connecting with your audience"
          />
          
          <SocialAuthButtons onSocialAuth={handleSocialAuth} />
          
          <SignUpForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-brand-blue hover:opacity-80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
