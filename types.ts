
export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  teacher_id: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  student_id: string;
  module_id: string;
  duration: number; // in seconds
  timestamp: string;
}

export interface ReviewReminder {
  id: string;
  student_id: string;
  module_id: string;
  module_title: string;
  scheduled_time: string;
  completed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

// Global declaration to fix "Cannot find type definition file for 'node'" 
// when using process.env in a browser environment.
declare global {
  interface Window {
    process: {
      env: {
        API_KEY: string;
        [key: string]: string | undefined;
      };
    };
  }
  // Removed global 'var process' declaration to resolve "Cannot redeclare block-scoped variable 'process'"
  // as 'process' is often pre-declared as a const in modern browser development environments.
}

export {};
