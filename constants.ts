
import { IncidentType, UserRole, Priority, IncidentStatus } from './types';

export const APP_NAME = "EduWatch";
export const APP_FULL_NAME = "Student Welfare & Discipline Support Management System";

export const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export const STATUS_COLORS = {
  [IncidentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [IncidentStatus.INVESTIGATING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [IncidentStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
  [IncidentStatus.ARCHIVED]: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const PRIORITY_COLORS = {
  [Priority.LOW]: 'text-slate-500',
  [Priority.MEDIUM]: 'text-blue-500',
  [Priority.HIGH]: 'text-orange-500',
  [Priority.CRITICAL]: 'text-red-500 font-bold',
};
