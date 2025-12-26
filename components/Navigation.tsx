
import React from 'react';
import { UserRole } from '../types';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  role?: UserRole;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab, role = 'student' }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { 
      id: 'study', 
      icon: role === 'teacher' ? '📚' : '⏱️', 
      label: role === 'teacher' ? 'Lessons' : 'Study' 
    },
    { id: 'ai', icon: '🤖', label: 'AI Help' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-2 safe-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentTab(tab.id)}
          className={`flex flex-col items-center p-2 transition-all duration-200 active:scale-90 ${
            currentTab === tab.id ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          <span className={`text-[10px] font-bold uppercase tracking-tight ${
             currentTab === tab.id ? 'opacity-100' : 'opacity-60'
          }`}>{tab.label}</span>
          {currentTab === tab.id && (
            <div className="h-1 w-1 bg-indigo-600 rounded-full mt-1"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
