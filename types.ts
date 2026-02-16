
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  GUIDANCE = 'GUIDANCE',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export enum IncidentStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED'
}

export enum IncidentCategory {
  DISCIPLINE = 'Discipline',
  COUNSELING = 'Counseling Request',
  WELFARE = 'Welfare Check'
}

export enum IncidentType {
  BULLYING = 'Bullying',
  LANGUAGE = 'Inappropriate Language',
  DIGITAL_MISUSE = 'Digital Misuse',
  ACADEMIC_DISHONESTY = 'Academic Dishonesty',
  OTHER = 'Other'
}

export enum IncidentLocation {
  CLASSROOM = 'Classroom',
  HALLWAY = 'Hallway',
  CAFETERIA = 'Cafeteria',
  GYM = 'Gym/Field',
  RESTROOM = 'Restroom',
  ONLINE = 'Online/Social Media',
  OFF_CAMPUS = 'Off-Campus'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum AlertType {
  INFO = 'INFO',
  EMERGENCY = 'EMERGENCY'
}

export interface SystemAlert {
  id: string;
  message: string;
  type: AlertType;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodValue: number; // 1-5
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  isApproved: boolean;
  avatarUrl?: string;
}

export interface IncidentReport {
  id: string;
  reporterId?: string;
  studentName: string;
  grade: string;
  section: string;
  category: IncidentCategory;
  incidentType: IncidentType;
  location: IncidentLocation;
  description: string;
  date: string;
  status: IncidentStatus;
  priority: Priority;
  aiAnalysis?: string;
  internalNotes?: CaseNote[];
  evidencePhotos?: string[]; // Base64 strings or URLs
  createdAt: string;
}

export interface CaseNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetId: string;
  timestamp: string;
}
