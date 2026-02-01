import React, { useState } from 'react';
import { ImageIcon, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center text-xs font-medium ${met ? 'text-green-600' : 'text-brutal-black/50'}`}>
      <CheckCircle className={`h-3 w-3 mr-1 ${met ? 'text-green-600' : 'text-brutal-black/30'}`} />
      {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-brutal-cyan border-4 border-brutal-black rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute top-1/4 right-5 sm:right-10 w-28 h-28 sm:w-40 sm:h-40 bg-brutal-lime border-4 border-brutal-black -rotate-6" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-brutal-yellow border-4 border-brutal-black rotate-45" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3">
            <div className="p-3 bg-brutal-yellow border-4 border-brutal-black" style={{boxShadow: '4px 4px 0px 0px #000000'}}>
              <ImageIcon className="h-8 w-8 text-brutal-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase">FLUX <span className="text-brutal-magenta">Studio</span></h1>
              <p className="text-sm font-bold uppercase">AI-Powered Image Analysis</p>
            </div>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-brutal-white border-4 border-brutal-black p-8" style={{boxShadow: '8px 8px 0px 0px #000000'}}>
          <h2 className="text-2xl font-black uppercase mb-6 text-center">CREATE ACCOUNT</h2>

          {error && (
            <div className="mb-4 p-3 bg-brutal-red text-brutal-white border-3 border-brutal-black font-bold text-sm" style={{boxShadow: '3px 3px 0px 0px #000000'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brutal-black/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border-3 border-brutal-black bg-brutal-white font-medium"
                  style={{boxShadow: '3px 3px 0px 0px #000000'}}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brutal-black/50" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="w-full pl-10 pr-12 py-3 border-3 border-brutal-black bg-brutal-white font-medium"
                  style={{boxShadow: '3px 3px 0px 0px #000000'}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-brutal-black/50" />
                  ) : (
                    <Eye className="h-5 w-5 text-brutal-black/50" />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              <div className="mt-2 grid grid-cols-2 gap-1">
                <PasswordRequirement met={hasMinLength} text="8+ characters" />
                <PasswordRequirement met={hasUppercase} text="Uppercase" />
                <PasswordRequirement met={hasLowercase} text="Lowercase" />
                <PasswordRequirement met={hasNumber} text="Number" />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brutal-black/50" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  className={`w-full pl-10 pr-4 py-3 border-3 bg-brutal-white font-medium ${
                    confirmPassword && !passwordsMatch ? 'border-brutal-red' : 'border-brutal-black'
                  }`}
                  style={{boxShadow: '3px 3px 0px 0px #000000'}}
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-brutal-red font-bold">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3 bg-brutal-cyan border-3 border-brutal-black font-black uppercase text-lg transition-all hover:bg-brutal-lime disabled:opacity-50"
              style={{boxShadow: '4px 4px 0px 0px #000000'}}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  CREATING...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="font-bold text-brutal-magenta hover:underline uppercase"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
