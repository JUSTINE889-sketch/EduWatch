
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { APP_NAME } from '../constants';
import Logo from './Logo';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.GUIDANCE, UserRole.STUDENT] },
    { label: 'Incidents', path: '/incidents', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.GUIDANCE] },
    { label: 'New Report', path: '/report', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT] },
    { label: 'Resources', path: '/resources', roles: Object.values(UserRole) },
    { label: 'Admin', path: '/admin', roles: [UserRole.ADMIN] },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <Logo size="sm" />
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{APP_NAME}</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              {navItems.filter(item => item.roles.includes(user.role)).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive(item.path) 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-semibold text-slate-800">{user.fullName}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user.role}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-sm text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Sign Out
            </button>
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 pb-4 px-4 space-y-1 animate-in slide-in-from-top duration-200">
          {navItems.filter(item => item.roles.includes(user.role)).map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
