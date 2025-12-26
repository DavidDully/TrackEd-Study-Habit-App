
import React, { useState } from 'react';
import { UserRole } from '../types';
import { supabaseService } from '../services/supabaseClient';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegistering) {
        if (!username) throw new Error("Username is required");
        const user = await supabaseService.signUp(email, password, username, role);
        onLogin(user);
      } else {
        const user = await supabaseService.signIn(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl animate-bounce">
          📈
        </div>
        <h1 className="text-4xl font-black tracking-tight">TrackEd</h1>
        <p className="opacity-90 font-medium text-indigo-100">Study Smarter, Track Better</p>
      </div>

      <div className="w-full bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl space-y-6">
        <div className="flex bg-black/20 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              !isRegistering ? 'bg-white text-indigo-600 shadow-md' : 'text-white/60'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              isRegistering ? 'bg-white text-indigo-600 shadow-md' : 'text-white/60'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-xs text-center font-bold text-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Full Name / Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-inner"
                placeholder="How should we call you?"
                required={isRegistering}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-inner"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-70">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                    role === 'student' ? 'bg-white text-indigo-600 border-white' : 'border-white/30 text-white'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                    role === 'teacher' ? 'bg-white text-indigo-600 border-white' : 'border-white/30 text-white'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs opacity-60 font-medium">
        © 2024 TrackEd Education Systems
      </p>
    </div>
  );
};

export default LoginView;
