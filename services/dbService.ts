
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, IncidentReport, IncidentStatus, IncidentType, Priority, ActivityLog, SystemAlert, MoodEntry, IncidentCategory, AlertType } from '../types';

const supabaseUrl = 'https://mryvfqmmxdovjjuqkzmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeXZmcW1teGRvdmpqdXFrem16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjgzMDgsImV4cCI6MjA4NjI0NDMwOH0.k63mhsRRyQ5Qcgknet5-LHTIFXGIU9K4VlDrMXR__2Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dbService = {
  // Profiles / Users
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role as UserRole,
      isApproved: u.is_approved,
      avatarUrl: u.avatar_url
    }));
  },
  
  addUser: async (user: Omit<User, 'id'>) => {
    const { data, error } = await supabase.from('profiles').insert([{
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      is_approved: user.isApproved
    }]).select();
    if (error) throw error;
    return data[0];
  },

  approveUser: async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
    if (error) throw error;
  },

  // Incidents
  getIncidents: async (): Promise<IncidentReport[]> => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(inc => ({
      id: inc.id,
      reporterId: inc.reporter_id,
      studentName: inc.student_name,
      grade: inc.grade,
      section: inc.section,
      category: inc.category as IncidentCategory,
      incidentType: inc.incident_type as IncidentType,
      location: inc.location,
      description: inc.description,
      date: inc.incident_date,
      status: inc.status as IncidentStatus,
      priority: inc.priority as Priority,
      aiAnalysis: inc.ai_analysis ? JSON.stringify(inc.ai_analysis) : undefined,
      internalNotes: inc.internal_notes,
      evidencePhotos: inc.evidence_photos,
      createdAt: inc.created_at
    }));
  },
  
  saveIncident: async (incident: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>): Promise<IncidentReport> => {
    const payload = {
      reporter_id: incident.reporterId && incident.reporterId.length > 20 ? incident.reporterId : null, // Handle real UUIDs
      student_name: incident.studentName,
      grade: incident.grade,
      section: incident.section,
      category: incident.category || IncidentCategory.DISCIPLINE,
      incident_type: incident.incidentType,
      location: incident.location,
      description: incident.description,
      incident_date: incident.date,
      priority: incident.priority,
      ai_analysis: incident.aiAnalysis ? JSON.parse(incident.aiAnalysis) : null,
      evidence_photos: incident.evidencePhotos || [],
      status: IncidentStatus.PENDING,
      internal_notes: []
    };

    const { data, error } = await supabase.from('incidents').insert([payload]).select();
    if (error) throw error;
    
    const saved = data[0];
    await dbService.logActivity(incident.reporterId || 'Anonymous', 'Report Submitted', saved.id);
    
    return {
      ...incident,
      id: saved.id,
      createdAt: saved.created_at,
      status: IncidentStatus.PENDING
    };
  },

  updateIncident: async (id: string, updates: Partial<IncidentReport>) => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.internalNotes) dbUpdates.internal_notes = updates.internalNotes;

    const { error } = await supabase.from('incidents').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  // Activity Logs
  logActivity: async (userName: string, action: string, targetId: string) => {
    // Attempt to link to a real user profile if we have one in logs
    const { error } = await supabase.from('activity_logs').insert([{
      user_name: userName,
      user_id: '00000000-0000-0000-0000-000000000001', // Default to admin for system logs
      action,
      target_id: targetId
    }]);
    if (error) console.error('Log failed:', error);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name,
      action: log.action,
      targetId: log.target_id,
      timestamp: log.timestamp
    }));
  },

  // Alerts
  getAlerts: async (): Promise<SystemAlert[]> => {
    const { data, error } = await supabase.from('system_alerts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(a => ({
      id: a.id,
      message: a.message,
      type: a.type as AlertType,
      createdAt: a.created_at
    }));
  },
  
  addAlert: async (alert: Omit<SystemAlert, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('system_alerts').insert([{
      message: alert.message,
      type: alert.type
    }]);
    if (error) throw error;
  },

  removeAlert: async (id: string) => {
    const { error } = await supabase.from('system_alerts').delete().eq('id', id);
    if (error) throw error;
  },

  // Moods
  getMoods: async (): Promise<MoodEntry[]> => {
    const { data, error } = await supabase.from('mood_entries').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(m => ({
      id: m.id,
      userId: m.user_id,
      moodValue: m.mood_value,
      timestamp: m.timestamp
    }));
  },
  
  logMood: async (userId: string, moodValue: number) => {
    // Check if user ID is a UUID, otherwise use the system default
    const validUserId = userId.length > 20 ? userId : '00000000-0000-0000-0000-000000000001';
    const { error } = await supabase.from('mood_entries').insert([{
      user_id: validUserId,
      mood_value: moodValue
    }]);
    if (error) throw error;
  }
};
