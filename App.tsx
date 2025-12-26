
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { supabaseService } from './services/supabaseClient';
import LoginView from './views/LoginView';
import StudentDashboard from './views/StudentDashboard';
import TeacherDashboard from './views/TeacherDashboard';
import Navigation from './components/Navigation';
import StudySessionView from './views/StudySessionView';
import AIReviewView from './views/AIReviewView';
import ProfileView from './views/ProfileView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'study' | 'ai' | 'profile'>('home');
  const [activeSessionModule, setActiveSessionModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      try {
        const savedUser = await supabaseService.getCurrentUser();
        if (savedUser) setUser(savedUser);
      } catch (e) {
        console.log("Auth init error", e);
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentTab('home');
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#4f46e5] justify-center items-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white mt-5 font-black text-[10px] tracking-[0.2em] uppercase">INITIALIZING TRACKED...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return user.role === 'teacher' ? (
          <TeacherDashboard user={user} />
        ) : (
          <StudentDashboard user={user} onStartStudy={(moduleId) => {
            setActiveSessionModule(moduleId);
            setCurrentTab('study');
          }} />
        );
      case 'study':
        // For teachers, "study" tab (renamed to Lessons) also leads to their Hub
        if (user.role === 'teacher') return <TeacherDashboard user={user} />;
        return <StudySessionView user={user} initialModuleId={activeSessionModule} />;
      case 'ai':
        return <AIReviewView />;
      case 'profile':
        return <ProfileView user={user} onLogout={handleLogout} onUpdateUser={setUser} />;
      default:
        return <div className="p-8 text-center">View Not Found</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="h-[60px] flex justify-between items-center px-5 py-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <h1 className="text-xl font-black text-indigo-600">TrackEd</h1>
        <div className="bg-indigo-50 px-2.5 py-1 rounded-lg">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{user.role}</span>
        </div>
      </header>
      
      <main className="flex-1 pb-24">
        {renderContent()}
      </main>

      <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} role={user.role} />
    </div>
  );
}
