
import React, { useState, useEffect } from 'react';
import { User, Module, StudySession, ReviewReminder } from '../types';
import { supabaseService } from '../services/supabaseClient';

interface StudentDashboardProps {
  user: User;
  onStartStudy: (moduleId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onStartStudy }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [reminders, setReminders] = useState<ReviewReminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [schedulingModule, setSchedulingModule] = useState<Module | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      const [m, r] = await Promise.all([
        supabaseService.getModules(),
        supabaseService.getReminders(user.id)
      ]);
      setModules(m);
      setReminders(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (schedulingModule && scheduleTime) {
      try {
        await supabaseService.addReminder({
          student_id: user.id,
          module_id: schedulingModule.id,
          module_title: schedulingModule.title,
          scheduled_time: new Date(scheduleTime).toISOString()
        } as any);
        await fetchData();
        setSchedulingModule(null);
        setScheduleTime('');
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await supabaseService.deleteReminder(id);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Library...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Upcoming Reviews</h3>
        {reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.slice(0, 3).map(rem => (
              <div key={rem.id} className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-indigo-900 truncate">{rem.module_title || (rem as any).moduleTitle}</p>
                  <p className="text-[10px] text-indigo-600 uppercase font-medium">
                    {new Date(rem.scheduled_time || (rem as any).scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button onClick={() => deleteReminder(rem.id)} className="text-indigo-300 ml-2">✕</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
             <p className="text-xs text-gray-400 italic">No reviews scheduled yet.</p>
          </div>
        )}
      </section>

      <div className="px-1">
        <input 
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 rounded-2xl bg-white border border-gray-100 text-gray-900 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none"
        />
      </div>

      <section className="space-y-3 pb-8">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-1">Library</h3>
        <div className="grid grid-cols-1 gap-4">
          {filteredModules.length > 0 ? (
            filteredModules.map(module => (
              <div key={module.id} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-gray-900 leading-tight text-lg pr-4">{module.title}</h4>
                  <button 
                    onClick={() => setSchedulingModule(module)}
                    className="p-2 bg-indigo-50 text-indigo-400 rounded-full hover:text-indigo-600 transition-colors"
                  >
                    <span className="text-lg">📅</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{module.description}</p>
                <button
                  onClick={() => onStartStudy(module.id)}
                  className="w-full bg-indigo-600 text-white font-black py-3 rounded-2xl text-sm shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                >
                  Start Session
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-40">
               <p className="text-sm font-bold uppercase tracking-widest">No modules found</p>
            </div>
          )}
        </div>
      </section>

      {/* Scheduling Modal */}
      {schedulingModule && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Schedule Review</h3>
              <button onClick={() => setSchedulingModule(null)} className="text-gray-300">✕</button>
            </div>
            <p className="text-sm text-gray-500 font-medium">Set a reminder for <span className="text-indigo-600 font-bold">"{schedulingModule.title}"</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 font-bold"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSchedulingModule(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={!scheduleTime}
                  className="flex-2 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-all"
                >
                  Set Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
