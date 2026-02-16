
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, IncidentType, Priority, IncidentLocation, IncidentCategory } from '../types';
import { dbService } from '../services/dbService';
import { analyzeIncident } from '../services/geminiService';
import { GRADES } from '../constants';

interface IncidentFormProps {
  isAnonymous: boolean;
  user?: User;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ isAnonymous, user }) => {
  const navigate = useNavigate();
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
    const result = await analyzeIncident(formData.description, formData.incidentType);
    if (result) {
      setAiResult(result);
      setFormData(prev => ({
        ...prev,
        priority: (result.suggestedPriority?.toUpperCase() as Priority) || prev.priority
      }));
    }
    setIsAnalyzing(false);
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
    
    const report = {
      ...formData,
      reporterId: isAnonymous ? undefined : user?.id,
      aiAnalysis: aiResult ? JSON.stringify(aiResult) : undefined,
      evidencePhotos: evidence,
    };

    dbService.saveIncident(report);
    
    setTimeout(() => {
      alert("Report submitted successfully and encrypted. Thank you for your cooperation.");
      navigate(isAnonymous ? '/login' : '/');
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {isAnonymous ? 'Anonymous Incident Reporting' : 'New Incident Report'}
          </h1>
          <p className="text-slate-500 mt-1">
            Provide as much detail as possible to help us address the welfare concern.
          </p>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="text-xs text-orange-800 leading-relaxed">
              <strong>Anti-Retaliation Policy:</strong> All reports are handled with the strictest confidentiality. Reporters are protected against any form of retaliation.
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Name (Target/Involved)</label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-200"
                placeholder="Full name of student"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
                  placeholder="e.g. A, Beta"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Case Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
              >
                {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type</label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
              >
                {Object.values(IncidentType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as IncidentLocation })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
              >
                {Object.values(IncidentLocation).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Detailed Description</label>
              <button
                type="button"
                onClick={handleAiAnalysis}
                disabled={!formData.description || isAnalyzing}
                className="text-xs flex items-center space-x-1 text-blue-600 font-bold hover:text-blue-800 disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>{isAnalyzing ? 'Analyzing...' : 'Smart Analysis'}</span>
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-200"
              placeholder="Provide context, witnesses, and details..."
            ></textarea>
          </div>

          {/* Evidence Capture */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Visual Evidence (Photos/Screenshots)</label>
            <div className="flex flex-wrap gap-4">
              {evidence.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeEvidence(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all bg-slate-50"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px] font-bold">Capture</span>
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
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-800">AI Assessment</h4>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full uppercase font-bold">Processed</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed italic">"{(() => {
                try { return JSON.parse(aiResult).summary }
                catch(e) { return aiResult.summary || aiResult }
              })()}"</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600">Priority:</span>
                <span className={`text-xs px-2 py-0.5 rounded border font-bold ${
                  formData.priority === Priority.CRITICAL ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {formData.priority}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentForm;
