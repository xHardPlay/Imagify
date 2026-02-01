import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import { Loader2, ImageIcon } from 'lucide-react';

export default function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* Background shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-brutal-yellow border-4 border-brutal-black rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
          <div className="absolute top-1/4 right-5 sm:right-10 w-28 h-28 sm:w-40 sm:h-40 bg-brutal-cyan border-4 border-brutal-black -rotate-6" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-4 bg-brutal-yellow border-4 border-brutal-black mb-6" style={{boxShadow: '4px 4px 0px 0px #000000'}}>
            <ImageIcon className="h-12 w-12 text-brutal-black" />
          </div>
          <h1 className="text-2xl font-black uppercase mb-4">FLUX <span className="text-brutal-magenta">Studio</span></h1>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-bold uppercase">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Authenticated - show main app
  return <App />;
}
