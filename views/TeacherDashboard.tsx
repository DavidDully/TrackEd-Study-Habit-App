
import React, { useState, useEffect } from 'react';
import { User, Module } from '../types';
import { supabaseService } from '../services/supabaseClient';
import mammoth from 'mammoth';

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ title: '', description: '', content: '' });
  const [isExtracting, setIsExtracting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const data = await supabaseService.getModules();
      setModules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cleanExtractedHtml = (html: string) => {
    let cleaned = html.replace(/<p>\s*<\/p>/gi, ''); 
    cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');
    return cleaned;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert("Please upload only .docx files.");
      return;
    }

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const cleanedHtml = cleanExtractedHtml(result.value);
          
          setNewModule(prev => ({ 
            ...prev, 
            content: cleanedHtml,
            title: prev.title || file.name.replace('.docx', '')
          }));
        } catch (err) {
          console.error("Extraction error:", err);
          alert("Failed to extract content from DOCX.");
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setIsExtracting(false);
      alert("Error reading file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newModule.title && newModule.content) {
      try {
        if (editingModuleId) {
          await supabaseService.updateModule(editingModuleId, newModule);
        } else {
          await supabaseService.addModule({
            ...newModule,
            teacher_id: user.id
          } as any);
        }
        await fetchModules();
        handleCloseModal();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleEditClick = (module: Module) => {
    setEditingModuleId(module.id);
    setNewModule({
      title: module.title,
      description: module.description,
      content: module.content
    });
    setShowAddModal(true);
  };

  const handleDeleteClick = async (moduleId: string) => {
    if (window.confirm("Are you sure you want to delete this module?")) {
      try {
        await supabaseService.deleteModule(moduleId);
        await fetchModules();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingModuleId(null);
    setNewModule({ title: '', description: '', content: '' });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Hub...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Lesson Hub</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Managing {modules.length} lessons</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100 transition-transform active:scale-90"
        >
          +
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Active Modules</h3>
        {modules.length > 0 ? (
          modules.map(module => {
            const isOwner = module.teacher_id === user.id || (module as any).teacherId === user.id;
            return (
              <div key={module.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">{module.title}</h4>
                  {!isOwner && (
                    <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                      Read Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{module.description}</p>
                {isOwner && (
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleEditClick(module)}
                      className="flex-1 text-[10px] font-bold py-2 bg-indigo-50 rounded-xl text-indigo-600 uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(module.id)}
                      className="flex-1 text-[10px] font-bold py-2 bg-red-50 rounded-xl text-red-600 uppercase tracking-wider hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-sm font-bold text-gray-400 uppercase">No lessons yet</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {editingModuleId ? 'Edit Lesson' : 'Create Lesson'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-300 hover:text-red-500">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  value={newModule.title}
                  onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 font-medium"
                  placeholder="e.g. Molecular Biology"
                />
              </div>

              {!editingModuleId && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Upload DOCX Content</label>
                  <div className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:bg-indigo-50 transition-colors">
                    <input
                      type="file"
                      accept=".docx"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isExtracting ? (
                      <div className="space-y-2">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs font-bold text-indigo-600">Extracting content...</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-2xl">📄</p>
                        <p className="text-xs font-bold text-indigo-600">Tap to upload .docx</p>
                        <p className="text-[10px] text-gray-400">Preserves headers and bolds</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newModule.description}
                  onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 font-medium"
                  placeholder="Short lesson summary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Content Preview / Edit</label>
                {editingModuleId ? (
                   <textarea
                    required
                    value={newModule.content}
                    onChange={(e) => setNewModule({...newModule, content: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 h-64 text-gray-900 font-medium leading-relaxed"
                  />
                ) : (
                  <div 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl h-48 overflow-y-auto text-gray-900 font-medium text-sm serif-reader module-content"
                    dangerouslySetInnerHTML={{ __html: newModule.content || '<span class="text-gray-300 italic">No content extracted yet...</span>' }}
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all text-lg"
              >
                {editingModuleId ? 'Update Lesson' : 'Publish Module'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
