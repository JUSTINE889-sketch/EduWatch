
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, IncidentReport, IncidentStatus, IncidentType, Priority, IncidentCategory } from '../types';
import { dbService } from '../services/dbService';
import { STATUS_COLORS, PRIORITY_COLORS, GRADES } from '../constants';
import { translateText, findPatterns } from '../services/geminiService';

interface IncidentReportsProps {
  user: User;
}

const IncidentReports: React.FC<IncidentReportsProps> = ({ user }) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
    await dbService.updateIncident(id, { status });
    loadIncidents();
    dbService.logActivity(user.fullName, `Updated status to ${status}`, id);
  };

  const handleAddNote = async (id: string) => {
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
    await dbService.updateIncident(id, { internalNotes: updatedNotes });
    loadIncidents();
    setNewNote('');
    dbService.logActivity(user.fullName, 'Added case note', id);
    // Update local selected incident if open
    if (selectedIncident?.id === id) {
      setSelectedIncident({...selectedIncident, internalNotes: updatedNotes});
    }
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

  useEffect(() => {
    setTranslatedText(null);
    setPatternResult(null);
  }, [selectedIncident?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium">Loading reports from cloud...</p>
      </div>
    );
  }

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
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 bg-white"
          />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white"
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
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
                    <div className="text-xs text-slate-500">{report.grade}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-[10px] font-bold uppercase mb-1 ${report.category === IncidentCategory.DISCIPLINE ? 'text-slate-500' : 'text-blue-600'}`}>
                      {report.category}
                    </div>
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:relative print:p-0 print:bg-white overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col print:shadow-none print:max-h-full print:w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center print:border-b-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                Case <span className="ml-2 font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-600 border border-slate-200 text-sm tracking-tight">#INC-{selectedIncident.id.toUpperCase()}</span>
              </h2>
              <button onClick={() => setSelectedIncident(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Case Description</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedIncident.description}</p>
                </section>

                <div className="grid grid-cols-2 gap-6 print:hidden">
                  <section>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(IncidentStatus).map(s => (
                        <button
                          key={s}
                          onClick={() => handleUpdateStatus(selectedIncident.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            selectedIncident.status === s ? STATUS_COLORS[s] + ' font-bold' : 'bg-white text-slate-500'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col border-l border-slate-100 pl-8 print:pl-0">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Case Timeline</h3>
                <div className="space-y-4 mb-4">
                  {selectedIncident.internalNotes?.map(note => (
                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-100 py-1">
                      <div className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="font-bold text-slate-900 text-xs">{note.authorName}</div>
                        <p className="text-slate-600 text-xs mt-1">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <textarea
                    placeholder="Log investigative action..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm min-h-[100px] bg-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button
                    onClick={() => handleAddNote(selectedIncident.id)}
                    className="mt-2 w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
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
