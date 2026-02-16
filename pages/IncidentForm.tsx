
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, IncidentType, Priority, IncidentLocation, IncidentCategory } from '../types';
import { dbService } from '../services/dbService';
import { analyzeIncident } from '../services/geminiService';
import { GRADES } from '../constants';
import { useToast } from '../components/Toast';

interface IncidentFormProps {
  isAnonymous: boolean;
  user?: User;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ isAnonymous, user }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    studentName: isAnonymous ? 'Anonymous Reporter' : '',
    grade: GRADES[0],
    section: '',
    category: IncidentCategory.DISCIPLINE,
    incidentType: IncidentType.OTHER,
    location: IncidentLocation.CLASSROOM,
    description: '',
    date: new Date().toISOString().split('T')[0],
    priority: Priority.MEDIUM,
  });
  
  const [evidence, setEvidence] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleAiAnalysis = async () => {
    if (!formData.description) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeIncident(formData.description, formData.incidentType);
      if (result) {
        setAiResult(result);
        setFormData(prev => ({
          ...prev,
          priority: (result.suggestedPriority?.toUpperCase() as Priority) || prev.priority
        }));
        showToast("AI analysis complete.", "info");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidence(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const report = {
        ...formData,
        reporterId: isAnonymous ? undefined : user?.id,
        aiAnalysis: aiResult ? JSON.stringify(aiResult) : undefined,
        evidencePhotos: evidence,
      };

      await dbService.saveIncident(report);
      showToast("Incident report successfully encrypted and saved to cloud.", "success");
      
      // Delay navigation slightly to let the toast be seen
      setTimeout(() => {
        navigate(isAnonymous ? '/login' : '/');
      }, 1500);
    } catch (error: any) {
      console.error("Submission failed:", error);
      showToast(error.message || "Failed to sync with cloud. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            <span>Secure Reporting Channel</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isAnonymous ? 'Anonymous Incident Reporting' : 'New Incident Report'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Provide details to help our guidance team address concerns efficiently.
          </p>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="text-[11px] text-orange-800 leading-relaxed font-medium">
              <strong>Anti-Retaliation Policy:</strong> All reports are handled with the strictest confidentiality. You are protected by school policy against any form of retaliation for reporting in good faith.
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Student Involved</label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                placeholder="Student's Full Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Grade</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Section</label>
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  placeholder="e.g. A"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Incident Type</label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
                className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as IncidentLocation })}
                className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                {Object.values(IncidentLocation).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Incident Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-5 py-3 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Case Description</label>
              <button
                type="button"
                onClick={handleAiAnalysis}
                disabled={!formData.description || isAnalyzing}
                className="text-[10px] flex items-center space-x-1.5 text-blue-600 font-black uppercase hover:text-blue-800 disabled:opacity-50 transition-all"
              >
                <svg className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>{isAnalyzing ? 'Analyzing...' : 'Smart Analysis'}</span>
              </button>
            </div>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 border-none bg-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder-slate-400 text-sm leading-relaxed"
              placeholder="Provide a detailed account of the incident, including witnesses and immediate context..."
            ></textarea>
          </div>

          {/* Evidence Capture */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Visual Evidence</label>
            <div className="flex flex-wrap gap-4">
              {evidence.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-md animate-in zoom-in-75">
                  <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeEvidence(i)}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 shadow-lg"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all bg-slate-50"
              >
                <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[9px] font-black uppercase">Add Photo</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          {aiResult && (
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">AI Safety Assessment</h4>
                </div>
                <span className="text-[9px] bg-blue-600 text-white px-3 py-1 rounded-full uppercase font-black shadow-sm">Verified</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed italic font-medium">"{aiResult.summary || "Analysis successfully processed. Guidance staff have been alerted to the urgency levels."}"</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Priority:</span>
                  <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase ${
                    formData.priority === Priority.CRITICAL ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {formData.priority}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 flex items-center justify-end space-x-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Syncing to Cloud...</span>
                </>
              ) : (
                <span>Submit Secure Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentForm;
