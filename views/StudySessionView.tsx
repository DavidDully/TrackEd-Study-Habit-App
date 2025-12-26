
import React, { useState, useEffect, useRef } from 'react';
import { User, Module } from '../types';
import { supabaseService } from '../services/supabaseClient';

interface StudySessionViewProps {
  user: User;
  initialModuleId: string | null;
}

const StudySessionView: React.FC<StudySessionViewProps> = ({ user, initialModuleId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId || '');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await supabaseService.getModules();
        setModules(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    if (initialModuleId) {
      setSelectedModuleId(initialModuleId);
    }
  }, [initialModuleId]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s - 1);
        setAccumulatedSeconds(a => a + 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, seconds]);

  const handleToggle = () => {
    if (!selectedModuleId) {
      alert("Please select a module first!");
      return;
    }
    setIsActive(!isActive);
    if (!isActive && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(customMinutes * 60);
    setAccumulatedSeconds(0);
    setSessionCompleted(false);
  };

  const adjustDuration = (mins: number) => {
    if (isActive) return;
    setCustomMinutes(mins);
    setSeconds(mins * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    if (accumulatedSeconds > 5) {
      try {
        await supabaseService.addSession({
          student_id: user.id,
          module_id: selectedModuleId,
          duration: accumulatedSeconds
        } as any);
        setSessionCompleted(true);
        setSeconds(customMinutes * 60);
        setAccumulatedSeconds(0);
      } catch (e: any) {
        alert("Error saving session: " + e.message);
      }
    } else {
      handleReset();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = (module: Module) => {
    const element = document.createElement("a");
    // Strip HTML for simple text download
    const plainText = module.content.replace(/<[^>]*>?/gm, '');
    const file = new Blob([`TITLE: ${module.title}\n\nDESCRIPTION: ${module.description}\n\nCONTENT:\n${plainText}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${module.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const currentModule = modules.find(m => m.id === selectedModuleId);

  const renderModuleContent = (module: Module) => {
    const isUrl = module.content.trim().startsWith('http');
    const hasHtml = module.content.includes('<') && module.content.includes('>');
    
    if (isUrl) {
      return (
        <div className="flex flex-col h-full space-y-4">
          <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-3xl text-center space-y-4">
            <div className="text-4xl">🔗</div>
            <h3 className="font-bold text-indigo-900">External Resource</h3>
            <p className="text-sm text-indigo-700">This module links to an external resource.</p>
            <a 
              href={module.content} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
            >
              View Lesson
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="serif-reader module-content animate-fade-in text-gray-800 text-lg pb-10">
        {hasHtml ? (
          <div dangerouslySetInnerHTML={{ __html: module.content }} />
        ) : (
          <p className="whitespace-pre-wrap">{module.content}</p>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Preparing Workspace...</div>;

  return (
    <div className="h-full flex flex-col bg-white relative">
      {isActive && currentModule && (
        <div className="bg-indigo-600 text-white px-4 py-3 shadow-xl flex justify-between items-center sticky top-0 z-50 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full border-4 ${seconds < 60 ? 'border-red-400' : 'border-white/30'} flex items-center justify-center font-mono font-bold text-sm bg-indigo-700`}>
              {formatTime(seconds)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Studying</h2>
              <p className="text-sm font-bold truncate max-w-[150px]">{currentModule.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleToggle}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold"
            >
              Pause
            </button>
            <button 
              onClick={handleComplete}
              className="bg-indigo-400 hover:bg-indigo-500 px-3 py-2 rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div 
        ref={contentRef}
        className={`flex-1 overflow-y-auto px-6 pt-6 pb-32 transition-all ${isActive ? 'bg-white' : 'bg-slate-50'}`}
      >
        {currentModule ? (
          <div className="space-y-6">
            {!isActive && (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">{currentModule.title}</h1>
                    <p className="text-gray-500 italic border-l-4 border-indigo-200 pl-4 mt-3">{currentModule.description}</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(currentModule)}
                    className="p-3.5 bg-white border border-gray-200 text-indigo-600 rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm active:scale-90"
                    title="Download module"
                  >
                    <span className="text-xl">📥</span>
                  </button>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Session Goal</span>
                    <span className="text-indigo-600 font-black text-sm">{customMinutes} MINUTES</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 25, 45, 60].map(m => (
                      <button
                        key={m}
                        onClick={() => adjustDuration(m)}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                          customMinutes === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleToggle}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  >
                    <span className="text-xl">⏱️</span> Start Focus Reader
                  </button>
                </div>
              </div>
            )}

            <div className={isActive ? 'mt-4 animate-fade-in' : 'mt-8 pt-8 border-t border-gray-100'}>
              {renderModuleContent(currentModule)}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">📚</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Select a Module</h3>
              <p className="text-sm text-gray-500 max-w-[250px] mx-auto">Pick a lesson from your library to start reading and tracking your progress.</p>
            </div>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl shadow-md outline-none font-bold text-gray-900 focus:ring-4 focus:ring-indigo-100 transition-all"
            >
              <option value="">Choose a lesson...</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {sessionCompleted && (
        <div className="fixed inset-0 bg-indigo-900/90 z-[100] flex items-center justify-center p-8 text-white text-center animate-fade-in backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[3rem] space-y-6 max-w-sm w-full shadow-2xl">
            <div className="text-7xl animate-bounce">🏆</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Well Done!</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Your study session has been recorded. Keep up the great momentum!</p>
            </div>
            <button 
              onClick={() => setSessionCompleted(false)}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-transform uppercase tracking-widest text-xs"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySessionView;
