
import { User, UserRole, IncidentReport, IncidentStatus, IncidentType, Priority, ActivityLog, SystemAlert, MoodEntry, IncidentCategory } from '../types';

const STORAGE_KEYS = {
  USERS: 'eduwatch_users',
  INCIDENTS: 'eduwatch_incidents',
  LOGS: 'eduwatch_logs',
  SESSION: 'eduwatch_session',
  ALERTS: 'eduwatch_alerts',
  MOODS: 'eduwatch_moods'
};

const getStorage = <T,>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

const setStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const defaultUsers: User[] = [
  { id: '1', email: 'admin@school.edu', role: UserRole.ADMIN, fullName: 'Super Admin', isApproved: true },
  { id: '2', email: 'guidance@school.edu', role: UserRole.GUIDANCE, fullName: 'Ms. Sarah Connor', isApproved: true },
  { id: '3', email: 'teacher@school.edu', role: UserRole.TEACHER, fullName: 'Mr. John Wick', isApproved: true },
];

export const dbService = {
  getUsers: (): User[] => getStorage(STORAGE_KEYS.USERS, defaultUsers),
  
  addUser: (user: User) => {
    const users = dbService.getUsers();
    setStorage(STORAGE_KEYS.USERS, [...users, user]);
  },

  getIncidents: (): IncidentReport[] => getStorage(STORAGE_KEYS.INCIDENTS, []),
  
  saveIncident: (incident: Omit<IncidentReport, 'id' | 'createdAt' | 'status'>): IncidentReport => {
    const incidents = dbService.getIncidents();
    const newIncident: IncidentReport = {
      ...incident,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: IncidentStatus.PENDING,
      category: incident.category || IncidentCategory.DISCIPLINE // Default to Discipline if not provided
    };
    setStorage(STORAGE_KEYS.INCIDENTS, [newIncident, ...incidents]);
    dbService.logActivity('System', 'Report Submitted', newIncident.id);
    return newIncident;
  },

  updateIncident: (id: string, updates: Partial<IncidentReport>) => {
    const incidents = dbService.getIncidents();
    const updated = incidents.map(inc => inc.id === id ? { ...inc, ...updates } : inc);
    setStorage(STORAGE_KEYS.INCIDENTS, updated);
  },

  logActivity: (userName: string, action: string, targetId: string) => {
    const logs = getStorage<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: 'system',
      userName,
      action,
      targetId,
      timestamp: new Date().toISOString()
    };
    setStorage(STORAGE_KEYS.LOGS, [newLog, ...logs].slice(0, 100));
  },

  getLogs: (): ActivityLog[] => getStorage(STORAGE_KEYS.LOGS, []),

  approveUser: (userId: string) => {
    const users = dbService.getUsers();
    setStorage(STORAGE_KEYS.USERS, users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
  },

  // Alerts Methods
  getAlerts: (): SystemAlert[] => getStorage(STORAGE_KEYS.ALERTS, []),
  
  addAlert: (alert: Omit<SystemAlert, 'id' | 'createdAt'>) => {
    const alerts = dbService.getAlerts();
    const newAlert = { ...alert, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.ALERTS, [newAlert, ...alerts]);
  },

  removeAlert: (id: string) => {
    const alerts = dbService.getAlerts();
    setStorage(STORAGE_KEYS.ALERTS, alerts.filter(a => a.id !== id));
  },

  // Mood Methods
  getMoods: (): MoodEntry[] => getStorage(STORAGE_KEYS.MOODS, []),
  
  logMood: (userId: string, moodValue: number) => {
    const moods = dbService.getMoods();
    const newMood: MoodEntry = {
      id: Date.now().toString(),
      userId,
      moodValue,
      timestamp: new Date().toISOString()
    };
    setStorage(STORAGE_KEYS.MOODS, [...moods, newMood]);
  }
};
