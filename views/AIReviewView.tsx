
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';

const AIReviewView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hello! I'm your TrackEd AI Assistant. \n\nI can help you:\n• Summarize your current modules\n• Create practice questions\n• Explain difficult concepts\n\nWhat are you studying today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await geminiService.getStudyHelp(userMsg);
    
    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white px-5 py-4 border-b flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100">🤖</div>
          <div>
            <h2 className="text-sm font-black text-gray-900 tracking-tight">AI Study Coach</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-indigo-600"
        >
          Reset Chat
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none font-medium'
            } whitespace-pre-wrap`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-1.5">
              <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your tutor anything..."
            className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 text-sm font-medium transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 disabled:opacity-30 active:scale-90 transition-all text-xl"
          >
            🚀
          </button>
        </div>
        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            Gemini 3 Flash Powered
          </p>
          <div className="flex gap-2">
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">Summary</span>
             <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">Quiz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReviewView;
