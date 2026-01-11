// Handles user authentication.
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handles form input changes.
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submits login credentials.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
       {/* Displays background watermark. */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <Leaf className="absolute -top-20 -right-20 text-brand-500/5 w-96 h-96 transform rotate-12" />
        <Leaf className="absolute bottom-0 left-0 text-brand-500/5 w-64 h-64 transform -rotate-12 translate-y-20 -translate-x-20" />
      </div>

      <div className="max-w-md w-full space-y-8 bg-dark-800 p-8 rounded-2xl border border-dark-700 shadow-2xl relative z-10 backdrop-blur-sm">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link to="/">
              <div className="bg-brand-500/10 p-4 rounded-2xl border border-brand-500/20 shadow-inner hover:bg-brand-500/20 transition-all cursor-pointer">
                <Leaf className="h-10 w-10 text-brand-500" />
              </div>
            </Link>
          </div>
          <h2 className="mt-2 text-3xl font-display font-bold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-dark-400">
            Sign in to <Link to="/" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">ShareEat</Link>
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Or{' '}
            <Link to="/register" className="font-medium text-brand-500 hover:text-brand-400 transition-colors underline decoration-brand-500/30 hover:decoration-brand-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg flex items-center" role="alert">
              <span className="block sm:inline text-sm">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dark-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 border border-dark-600 placeholder-dark-500 text-white bg-dark-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="appearance-none block w-full px-4 py-3 border border-dark-600 placeholder-dark-500 text-white bg-dark-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all sm:text-sm pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-dark-900 transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
