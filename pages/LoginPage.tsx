
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/dbService';
import { APP_FULL_NAME } from '../constants';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegistering) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase().trim(),
        fullName,
        role,
        isApproved: true,
      };
      
      dbService.addUser(newUser);
      setSuccess(`Account for ${fullName} is ready! Please sign in below.`);
      setFullName('');
      setPassword('');
      setIsRegistering(false);
    } else {
      const users = dbService.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      
      if (user) {
        if (!user.isApproved) {
          setError('Account pending approval by administration.');
          return;
        }
        onLogin(user);
      } else {
        setError('User not found. Check your email or create a new account.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <Logo size="lg" className="mx-auto mb-6" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isRegistering ? 'Join EduWatch' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">{APP_FULL_NAME}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center animate-in slide-in-from-top-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center animate-in slide-in-from-top-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.PARENT}>Parent</option>
                  <option value={UserRole.TEACHER}>Teacher</option>
                  <option value={UserRole.GUIDANCE}>Guidance Staff</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="name@school.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
          >
            {isRegistering ? 'Already a member? Sign in' : "New to EduWatch? Join now"}
          </button>
          
          <div className="pt-6 border-t border-slate-50">
            <Link to="/report-anonymous" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
              Submit Anonymous Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
