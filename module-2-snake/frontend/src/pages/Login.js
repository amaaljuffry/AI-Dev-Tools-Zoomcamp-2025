import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        if (!email) {
          setError('Email is required for signup');
          setLoading(false);
          return;
        }
        result = await signup(username, email, password);
      } else {
        result = await login(username, password);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-light tracking-tight text-black">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-black opacity-60">
            {isSignup
              ? 'Sign up to save your high scores'
              : 'Login to continue playing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-light text-black mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="email" className="block text-sm font-light text-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={isSignup}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-light text-black mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm rounded">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">{error}</p>
                  {!isSignup && error.includes('sign up') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup(true);
                        setError('');
                      }}
                      className="mt-2 text-red-700 underline hover:text-red-900 font-medium"
                    >
                      Click here to create an account
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 px-4 border border-black bg-black text-white hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-light">
                {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
              </span>
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-sm font-light text-black hover:opacity-60 transition-opacity"
            >
              {isSignup
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
