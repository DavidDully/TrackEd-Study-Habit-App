
import { Module, StudySession, User, UserRole, ReviewReminder } from '../types';

const STORAGE_KEYS = {
  MODULES: 'tracked_modules',
  SESSIONS: 'tracked_sessions',
  REMINDERS: 'tracked_reminders',
  USER: 'tracked_current_user',
  ALL_USERS: 'tracked_all_users'
};

const defaultModules: Module[] = [
  {
    id: '1',
    title: 'Introduction to Biology',
    description: 'Learn the basics of cell structure and function.',
    content: 'Biology is the study of life. In this module, we explore how cells are the building blocks of every living organism...',
    // Fix: teacherId -> teacher_id
    teacher_id: 't1',
    // Fix: createdAt -> created_at
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Advanced Calculus',
    description: 'Deep dive into integrals and derivatives.',
    content: 'In this module, we focus on the fundamental theorem of calculus and its applications in real-world scenarios...',
    // Fix: teacherId -> teacher_id
    teacher_id: 't1',
    // Fix: createdAt -> created_at
    created_at: new Date().toISOString()
  }
];

export const mockSupabase = {
  getModules: (): Module[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MODULES);
    return data ? JSON.parse(data) : defaultModules;
  },

  addModule: (module: Partial<Module>) => {
    const modules = mockSupabase.getModules();
    const newModule = {
      ...module,
      id: Math.random().toString(36).substr(2, 9),
      // Fix: createdAt -> created_at
      created_at: new Date().toISOString(),
    } as Module;
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify([newModule, ...modules]));
    return newModule;
  },

  updateModule: (moduleId: string, updatedData: Partial<Module>) => {
    const modules = mockSupabase.getModules();
    const updatedModules = modules.map(m => m.id === moduleId ? { ...m, ...updatedData } : m);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updatedModules));
    return updatedModules.find(m => m.id === moduleId);
  },

  deleteModule: (moduleId: string) => {
    const modules = mockSupabase.getModules();
    const filtered = modules.filter(m => m.id !== moduleId);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(filtered));
  },

  getSessions: (studentId: string): StudySession[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const sessions: StudySession[] = data ? JSON.parse(data) : [];
    // Fix: studentId -> student_id
    return sessions.filter(s => s.student_id === studentId);
  },

  addSession: (session: Omit<StudySession, 'id' | 'timestamp'>) => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const sessions: StudySession[] = data ? JSON.parse(data) : [];
    const newSession: StudySession = {
      ...session,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([newSession, ...sessions]));
    return newSession;
  },

  getReminders: (studentId: string): ReviewReminder[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    const reminders: ReviewReminder[] = data ? JSON.parse(data) : [];
    // Fix: studentId -> student_id
    return reminders.filter(r => r.student_id === studentId);
  },

  addReminder: (reminder: Omit<ReviewReminder, 'id' | 'completed'>) => {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    const reminders: ReviewReminder[] = data ? JSON.parse(data) : [];
    const newReminder: ReviewReminder = {
      ...reminder,
      id: Math.random().toString(36).substr(2, 9),
      completed: false
    };
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([newReminder, ...reminders]));
    return newReminder;
  },

  deleteReminder: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    const reminders: ReviewReminder[] = data ? JSON.parse(data) : [];
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders.filter(r => r.id !== id)));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  signUp: (email: string, password: string, username: string, role: UserRole): User => {
    const allUsersData = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    const allUsers: User[] = allUsersData ? JSON.parse(allUsersData) : [];
    
    if (allUsers.find(u => u.email === email)) {
      throw new Error("User already exists with this email.");
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username,
      password, // In a real app, this would be hashed
      role
    };

    allUsers.push(newUser);
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return newUser;
  },

  signIn: (email: string, password: string): User => {
    const allUsersData = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    const allUsers: User[] = allUsersData ? JSON.parse(allUsersData) : [];
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  updateUser: (updatedData: Partial<User>): User => {
    const currentUser = mockSupabase.getCurrentUser();
    if (!currentUser) throw new Error("No user logged in");

    const allUsersData = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    let allUsers: User[] = allUsersData ? JSON.parse(allUsersData) : [];

    const updatedUser = { ...currentUser, ...updatedData };
    
    allUsers = allUsers.map(u => u.id === currentUser.id ? updatedUser : u);
    
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  },

  signOut: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};
