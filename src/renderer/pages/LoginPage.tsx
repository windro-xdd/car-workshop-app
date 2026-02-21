import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { setCurrentUser } = useUserStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('admin@workshop.local');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.loginUser({ email, password });
      if (result.success) {
        setCurrentUser(result.data!);
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Error logging in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.registerUser({
        email,
        password,
        name,
        role: 'staff',
      });
      if (result.success) {
        setCurrentUser(result.data!);
        onLoginSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Error registering');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200/60 p-8 md:p-10 transition-all duration-300">
          <div className="text-center mb-8">
            <img src="./kripa-logo.png" alt="Kripa Car Care" className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Kripa Car Care</h1>
            <p className="text-sm text-zinc-500 mt-1.5">Workshop Management System</p>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="transition-all duration-300">
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${!isLogin ? 'max-h-24 opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0'}`}>
              <FormInput
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
                tabIndex={!isLogin ? 0 : -1}
              />
            </div>

            <FormInput
              label="Username / Email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin or your@email.com"
              disabled={loading}
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <div className="mt-6">
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                fullWidth
                size="lg"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-brand-600 hover:text-brand-700 transition-colors font-medium focus:outline-none focus:underline"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </button>
          </div>

          <div className="mt-8 bg-zinc-50 rounded-xl border border-zinc-100 p-4 flex items-start gap-3">
            <div className="text-zinc-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0010 5.5V9H3a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-1.16-1.81l.66-3.69A4.5 4.5 0 0014.5 1zm-3 4.5a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-zinc-600">
              <p className="font-medium text-zinc-700 mb-1">Demo Credentials</p>
              <p>Email: <span className="font-medium text-zinc-800">admin@workshop.local</span></p>
              <p>Password: <span className="font-medium text-zinc-800">admin123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
