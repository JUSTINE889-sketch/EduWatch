
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, IncidentReport, IncidentStatus, IncidentType, Priority, IncidentCategory } from '../types';
import { dbService } from '../services/dbService';
import { STATUS_COLORS, PRIORITY_COLORS, GRADES } from '../constants';
import { translateText, findPatterns } from '../services/geminiService';

interface IncidentReportsProps {
  user: User;
}

const IncidentReports: React.FC<IncidentReportsProps> = ({ user }) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>(dbService.getIncidents());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [newNote, setNewNote] = useState('');
  
  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Pattern state
  const [patternResult, setPatternResult] = useState<any>(null);
  const [isCheckingPatterns, setIsCheckingPatterns] = useState(false);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchesSearch = inc.studentName.toLowerCase().includes(search.toLowerCase()) || 
                           inc.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = !filterType || inc.incidentType === filterType;
      const matchesStatus = !filterStatus || inc.status === filterStatus;
      const matchesCategory = !filterCategory || inc.category === filterCategory;
      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [incidents, search, filterType, filterStatus, filterCategory]);

  const handleUpdateStatus = (id: string, status: IncidentStatus) => {
    dbService.updateIncident(id, { status });
    setIncidents(dbService.getIncidents());
    dbService.logActivity(user.fullName, `Updated status to ${status}`, id);
  };

  const handleAddNote = (id: string) => {
    if (!newNote.trim()) return;
    const current = incidents.find(i => i.id === id);
    if (!current) return;

    const note = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.id,
      authorName: user.fullName,
      content: newNote,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...(current.internalNotes || []), note];
    dbService.updateIncident(id, { internalNotes: updatedNotes });
    setIncidents(dbService.getIncidents());
    setNewNote('');
    dbService.logActivity(user.fullName, 'Added case note', id);
  };

  const handleTranslate = async (lang: string) => {
    if (!selectedIncident) return;
    setIsTranslating(true);
    const result = await translateText(selectedIncident.description, lang);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  const handleCheckPatterns = async () => {
    if (!selectedIncident) return;
    setIsCheckingPatterns(true);
    const history = incidents
      .filter(i => i.id !== selectedIncident.id && i.studentName === selectedIncident.studentName)
      .map(i => i.description);
    
    const result = await findPatterns(selectedIncident.description, history);
    setPatternResult(result);
    setIsCheckingPatterns(false);
  };

  const handleExport = () => {
    window.print();
  };

  // Reset tool states when changing selection
  useEffect(() => {
    setTranslatedText(null);
    setPatternResult(null);
  }, [selectedIncident?.id]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Incident Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search student or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 bg-slate-200"
          />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-200"
          >
            <option value="">All Categories</option>
            {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-slate-200"
          >
            <option value="">All Status</option>
            {Object.values(IncidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category & Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{report.studentName}</div>
                    <div className="text-xs text-slate-500">{report.grade} • {report.section}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-bold uppercase mb-1 ${report.category === IncidentCategory.DISCIPLINE ? 'text-slate-500' : 'text-blue-600'}`}>
                      {report.category}
                    </div>
                    <div className="text-sm font-medium text-slate-700">{report.incidentType}</div>
                    <div className="text-xs text-slate-400">{new Date(report.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[report.priority]}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[report.status]}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedIncident(report)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No incidents matching your criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:relative print:p-0 print:bg-white overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col print:shadow-none print:max-h-full print:w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center print:border-b-2">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${selectedIncident.category === IncidentCategory.DISCIPLINE ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'} rounded-xl flex items-center justify-center`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedIncident.category === IncidentCategory.DISCIPLINE ? 'Discipline Case' : 'Support Request'} #INC-{selectedIncident.id}
                  </h2>
                  <p className="text-sm text-slate-500 uppercase tracking-widest font-bold text-[10px]">{selectedIncident.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 print:hidden">
                <button 
                  onClick={handleExport}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Export PDF
                </button>
                <button onClick={() => setSelectedIncident(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:overflow-visible">
              {/* Left Column - Core Info */}
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Case Description</h3>
                    <div className="flex items-center space-x-2 print:hidden">
                       <span className="text-xs text-slate-400">Translate to:</span>
                       <select 
                         onChange={(e) => handleTranslate(e.target.value)}
                         className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                         defaultValue=""
                       >
                         <option value="" disabled>Select</option>
                         <option value="Spanish">Spanish</option>
                         <option value="Mandarin">Mandarin</option>
                         <option value="Tagalog">Tagalog</option>
                         <option value="French">French</option>
                       </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">{selectedIncident.description}</p>
                    
                    {isTranslating && (
                      <div className="animate-pulse bg-blue-100 h-16 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">AI Translation in progress...</span>
                      </div>
                    )}
                    
                    {translatedText && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-4 animate-in slide-in-from-left-2">
                        <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Translation Result</div>
                        <p className="text-sm text-blue-800 italic leading-relaxed">{translatedText}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Case Intelligence</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* AI Priority Analysis */}
                      {selectedIncident.aiAnalysis && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <h4 className="text-xs font-bold text-indigo-800 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Initial Triage Result
                          </h4>
                          <p className="text-xs text-indigo-700 italic">"{(() => {
                            try { return JSON.parse(selectedIncident.aiAnalysis).summary }
                            catch(e) { return selectedIncident.aiAnalysis }
                          })()}"</p>
                        </div>
                      )}

                      {/* Pattern Detection Tool */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-center">
                         {!patternResult ? (
                           <button 
                             onClick={handleCheckPatterns}
                             disabled={isCheckingPatterns}
                             className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
                           >
                             {isCheckingPatterns ? (
                               <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Analyzing Patterns...</span></>
                             ) : (
                               <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><span>Check Historical Patterns</span></>
                             )}
                           </button>
                         ) : (
                           <div className={`p-1 rounded-lg ${patternResult.isPattern ? 'text-orange-800 bg-orange-50' : 'text-green-800 bg-green-50'}`}>
                             <div className="flex items-center justify-between mb-1">
                               <span className="text-[10px] font-bold uppercase">{patternResult.isPattern ? 'Trend Detected' : 'Unique Case'}</span>
                               <span className="text-[10px] opacity-70">Confidence: {Math.round(patternResult.confidence * 100)}%</span>
                             </div>
                             <p className="text-[11px] font-medium leading-tight">{patternResult.finding}</p>
                           </div>
                         )}
                      </div>
                   </div>
                </section>

                <div className="grid grid-cols-2 gap-6 print:hidden">
                  <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(IncidentStatus).map(s => (
                        <button
                          key={s}
                          onClick={() => handleUpdateStatus(selectedIncident.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex-1 min-w-[100px] ${
                            selectedIncident.status === s 
                            ? STATUS_COLORS[s] + ' font-bold ring-2 ring-blue-500 ring-offset-1' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Case Visibility</h3>
                    <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <span>This report is only visible to Guidance & Admin.</span>
                    </div>
                  </section>
                </div>
              </div>

              {/* Right Column - Timeline & Notes */}
              <div className="lg:col-span-4 flex flex-col border-l border-slate-100 pl-8 print:border-none print:pl-0 print:mt-8">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Student Context</h3>
                  <div className={`rounded-xl p-4 text-white ${selectedIncident.category === IncidentCategory.DISCIPLINE ? 'bg-slate-900' : 'bg-blue-900'}`}>
                    <div className="text-lg font-bold">{selectedIncident.studentName}</div>
                    <div className="text-xs text-white/60 uppercase font-medium">{selectedIncident.grade} • Section {selectedIncident.section}</div>
                    <div className="mt-4 flex items-center space-x-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/10 ${PRIORITY_COLORS[selectedIncident.priority]}`}>
                        {selectedIncident.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Case Timeline</h3>
                <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 min-h-[200px] print:overflow-visible">
                  {selectedIncident.internalNotes?.map(note => (
                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-100 py-1">
                      <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div className="bg-slate-50 rounded-lg p-3 text-sm hover:shadow-sm transition-shadow border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-900 text-xs">{note.authorName}</span>
                          <span className="text-[9px] text-slate-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed italic">{note.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedIncident.internalNotes || selectedIncident.internalNotes.length === 0) && (
                    <div className="text-center py-8 text-slate-300 italic text-xs bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">No active case logs.</div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 print:hidden">
                  <textarea
                    placeholder="Log investigative action..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] bg-slate-200 resize-none"
                  />
                  <button
                    onClick={() => handleAddNote(selectedIncident.id)}
                    className="mt-2 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                  >
                    Add Log Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReports;
