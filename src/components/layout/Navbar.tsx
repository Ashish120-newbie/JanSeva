import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Menu,
  X,
  Shield,
  Phone as PhoneIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Services', path: '/#services', icon: FileText },
  { name: 'AI Assistant', path: '/#assistant', icon: MessageSquare },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'About', path: '/#about', icon: Shield },
  { name: 'Contact', path: '/#contact', icon: PhoneIcon },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              JanSeva
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Shield className="w-4 h-4" />
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-200">
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg"
              >
                <Shield className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
