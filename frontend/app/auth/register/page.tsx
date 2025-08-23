"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Eye, EyeOff, UserPlus, Coins, Briefcase, Plane, Target } from 'lucide-react';

const archetypes = [
  {
    id: 'Allowance',
    name: 'Allowance',
    icon: Coins,
    description: 'I receive monthly allowance from family',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'Jobber',
    name: 'Jobber', 
    icon: Briefcase,
    description: 'I work part-time while studying',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'Traveler',
    name: 'Traveler',
    icon: Plane,
    description: 'I study abroad or travel frequently',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'Saver',
    name: 'Saver',
    icon: Target,
    description: 'I focus on saving for future goals',
    color: 'bg-orange-100 text-orange-600',
  },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    archetype: '' as 'Allowance' | 'Jobber' | 'Traveler' | 'Saver' | '',
    telegram_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!formData.archetype) {
      setError('Please select your student archetype');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        archetype: formData.archetype,
        telegram_id: formData.telegram_id || undefined,
      });
      router.push('/auth/onboarding');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const selectArchetype = (archetype: 'Allowance' | 'Jobber' | 'Traveler' | 'Saver') => {
    setFormData(prev => ({ ...prev, archetype }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
            <span className="text-2xl font-bold text-white">₿</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Budgeto!</h1>
          <p className="text-gray-600">Start your financial journey today 🇬🇷</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input pr-12"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div>
                <label className="form-label">Telegram Username (Optional)</label>
                <input
                  type="text"
                  name="telegram_id"
                  value={formData.telegram_id}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="@your_telegram"
                />
              </div>
            </div>

            {/* Archetype Selection */}
            <div>
              <label className="form-label">Choose Your Student Type</label>
              <div className="grid grid-cols-2 gap-3">
                {archetypes.map((archetype) => {
                  const Icon = archetype.icon;
                  const isSelected = formData.archetype === archetype.id;
                  
                  return (
                    <button
                      key={archetype.id}
                      type="button"
                      onClick={() => selectArchetype(archetype.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${archetype.color}`}>
                        <Icon size={20} />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{archetype.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{archetype.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg font-semibold flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}