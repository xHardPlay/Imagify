import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-2">
      {/* User info dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 border-3 border-brutal-black bg-brutal-white font-bold text-sm uppercase transition-all hover:bg-brutal-yellow"
          style={{boxShadow: '3px 3px 0px 0px #000000'}}
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">{user.email}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-brutal-white border-3 border-brutal-black z-50"
            style={{boxShadow: '4px 4px 0px 0px #000000'}}
          >
            <div className="p-3 border-b-2 border-brutal-black">
              <p className="text-xs font-bold uppercase text-brutal-black/50">Signed in as</p>
              <p className="text-sm font-bold truncate">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-bold uppercase text-brutal-red hover:bg-brutal-red hover:text-brutal-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Visible logout button */}
      <button
        onClick={handleLogout}
        className="p-2 border-3 border-brutal-black bg-brutal-red text-brutal-white font-bold transition-all hover:bg-red-700"
        style={{boxShadow: '3px 3px 0px 0px #000000'}}
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
