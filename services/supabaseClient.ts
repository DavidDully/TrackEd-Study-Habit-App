
import { createClient } from '@supabase/supabase-js';
import { User, Module, StudySession, ReviewReminder, UserRole } from '../types';
import { mockSupabase } from './mockSupabase';

// Project credentials provided by the user
const SUPABASE_URL = 'https://zyjkeefnvteowkeqvitl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jnTRg1BTwwplZqDUh_pELA_I9cZUVUz';

// Check if keys are still placeholders to decide whether to use mock or real service
const isMockMode = SUPABASE_URL.includes('YOUR_PROJECT_ID') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY');

export let supabase: any = null;
if (!isMockMode) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabaseService = {
  async signUp(email: string, password: string, username: string, role: UserRole) {
    if (isMockMode) return mockSupabase.signUp(email, password, username, role);
    
    console.log("Starting signup for:", email);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    
    if (authError) {
      console.error("Auth SignUp Error:", authError);
      throw authError;
    }
    
    if (!authData.user) throw new Error("Sign up failed: No user returned from Supabase Auth");

    console.log("Auth success, creating profile for UID:", authData.user.id);

    // Profile data to insert
    const profile = { 
      id: authData.user.id, 
      username, 
      email, 
      role 
    };

    // We use insert().select() to verify the operation immediately
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();
      
    if (profileError) {
      console.error("Critical Profile Creation Error:", profileError);
      // Detailed error message to help the user identify RLS vs Schema issues
      throw new Error(`Auth worked, but Database Profile failed: ${profileError.message} (${profileError.code}). Check your RLS policies in Supabase SQL Editor.`);
    }
    
    return newProfile as User;
  },

  async signIn(email: string, password: string) {
    if (isMockMode) return mockSupabase.signIn(email, password);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Sign in failed");

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError) {
      console.error("SignIn Profile Fetch Error:", profileError);
      throw new Error("Login successful but couldn't find your profile. If you just registered, try refreshing.");
    }
    
    return profileData as User;
  },

  async getCurrentUser(): Promise<User | null> {
    if (isMockMode) return mockSupabase.getCurrentUser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return profile as User;
  },

  async updateUser(updatedData: Partial<User>) {
    if (isMockMode) return mockSupabase.updateUser(updatedData);
    const user = await this.getCurrentUser();
    if (!user) throw new Error("No user logged in");
    const { data, error } = await supabase.from('profiles').update(updatedData).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  async getModules(): Promise<Module[]> {
    if (isMockMode) return mockSupabase.getModules();
    const { data, error } = await supabase.from('modules').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addModule(module: Partial<Module>) {
    if (isMockMode) return mockSupabase.addModule(module);
    const { data, error } = await supabase.from('modules').insert([module]).select().single();
    if (error) throw error;
    return data;
  },

  async updateModule(moduleId: string, updatedData: Partial<Module>) {
    if (isMockMode) return mockSupabase.updateModule(moduleId, updatedData);
    const { data, error } = await supabase.from('modules').update(updatedData).eq('id', moduleId).select().single();
    if (error) throw error;
    return data;
  },

  async deleteModule(moduleId: string) {
    if (isMockMode) return mockSupabase.deleteModule(moduleId);
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (error) throw error;
  },

  async getSessions(studentId: string): Promise<StudySession[]> {
    if (isMockMode) return mockSupabase.getSessions(studentId);
    const { data, error } = await supabase.from('sessions').select('*').eq('student_id', studentId).order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addSession(session: Omit<StudySession, 'id' | 'timestamp'>) {
    if (isMockMode) return mockSupabase.addSession(session);
    const { data, error } = await supabase.from('sessions').insert([session]).select().single();
    if (error) throw error;
    return data;
  },

  async getReminders(studentId: string): Promise<ReviewReminder[]> {
    if (isMockMode) return mockSupabase.getReminders(studentId);
    const { data, error } = await supabase.from('reminders').select('*').eq('student_id', studentId).eq('completed', false);
    if (error) throw error;
    return data || [];
  },

  async addReminder(reminder: Omit<ReviewReminder, 'id' | 'completed'>) {
    if (isMockMode) return mockSupabase.addReminder(reminder);
    const { data, error } = await supabase.from('reminders').insert([reminder]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteReminder(id: string) {
    if (isMockMode) return mockSupabase.deleteReminder(id);
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  },

  async signOut() {
    if (isMockMode) return mockSupabase.signOut();
    await supabase.auth.signOut();
  }
};
