
import React, { useState, useEffect } from 'react';
import { User, StudySession, Module } from '../types';
import { supabaseService, supabase } from '../services/supabaseClient';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onUpdateUser }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail] = useState(user.email);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      if (user.role === 'student') {
        const [s, m] = await Promise.all([
          supabaseService.getSessions(user.id),
          supabaseService.getModules()
        ]);
        setSessions(s);
        setModules(m);
      } else {
        // Teacher Logic
        const m = await supabaseService.getModules();
        // Filter modules created by this teacher
        const teacherModules = m.filter(mod => mod.teacher_id === user.id || (mod as any).teacherId === user.id);
        setModules(teacherModules);
        
        // Fetch ALL sessions to calculate total views for teacher's modules
        if (supabase) {
           const { data: allSessions } = await supabase.from('sessions').select('module_id');
           if (allSessions) {
             const teacherModuleIds = new Set(teacherModules.map(tm => tm.id));
             const viewSessions = allSessions.filter((s: any) => teacherModuleIds.has(s.module_id));
             setSessions(viewSessions);
           }
        } else {
          // Mock mode logic: get all mock sessions
          const allData = localStorage.getItem('tracked_sessions');
          const allSessions: StudySession[] = allData ? JSON.parse(allData) : [];
          const teacherModuleIds = new Set(teacherModules.map(tm => tm.id));
          const viewSessions = allSessions.filter((s: any) => teacherModuleIds.has(s.module_id || (s as any).moduleId));
          setSessions(viewSessions);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await supabaseService.updateUser({ username: editUsername, email: editEmail });
      onUpdateUser(data as User);
      setIsEditing(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getModuleName = (id: string) => modules.find(m => m.id === id)?.title || "Unknown Module";

  // Student metrics
  const totalFocusSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
  const uniqueModulesCount = new Set(sessions.map(s => s.module_id || (s as any).moduleId)).size;

  // Teacher metrics
  const modulesPublished = modules.length;
  const totalViews = sessions.length; // Each session counts as a "view" of the lesson

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Profile...</div>;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-full pb-32">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center space-y-4">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner border-4 border-white">
          {user.role === 'teacher' ? '👨‍🏫' : '🎓'}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <input 
              className="w-full p-3 rounded-xl border border-indigo-100 text-center font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              placeholder="Username"
            />
            <input 
              className="w-full p-3 rounded-xl border border-indigo-100 text-center text-sm text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="Email"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.username}</h2>
              <p className="text-sm font-medium text-gray-400">{user.email}</p>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
          {user.role === 'teacher' ? 'Teaching Impact' : 'Study Performance'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-black text-indigo-600">
              {user.role === 'teacher' ? modulesPublished : totalFocusMinutes}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {user.role === 'teacher' ? 'Published' : 'Minutes'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-black text-purple-600">
              {user.role === 'teacher' ? totalViews : uniqueModulesCount}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {user.role === 'teacher' ? 'Views' : 'Lessons'}
            </p>
          </div>
        </div>
      </div>

      {user.role === 'student' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Study History</h3>
          <div className="space-y-2">
            {sessions.length > 0 ? (
              sessions.slice(0, 5).map(session => (
                <div key={session.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{getModuleName(session.module_id || (session as any).moduleId)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">+{Math.floor((session.duration || 0) / 60)}m</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-300 uppercase">No recorded data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {user.role === 'teacher' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Recent Uploads</h3>
          <div className="space-y-2">
            {modules.length > 0 ? (
              modules.slice(0, 5).map(module => (
                <div key={module.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{module.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(module.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase">Live</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-300 uppercase">No modules published</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={onLogout}
          className="w-full p-4 bg-red-50 text-red-600 font-black rounded-2xl shadow-sm border border-red-100 active:scale-95 transition-all text-sm uppercase tracking-wider"
        >
          Log Out Account
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
