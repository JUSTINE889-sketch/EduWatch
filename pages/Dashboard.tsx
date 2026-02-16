
import React, { useMemo, useState, useEffect } from 'react';
import { User, IncidentStatus, IncidentType, IncidentLocation, UserRole, Priority, IncidentCategory, IncidentReport, MoodEntry, ActivityLog } from '../types';
import { dbService } from '../services/dbService';
import { getWellnessTip } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [wellnessTip, setWellnessTip] = useState<string>('Loading supportive thoughts...');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  // Quick Action Modal State
  const [activeQuickAction, setActiveQuickAction] = useState<{type: IncidentCategory, label: string} | null>(null);
  const [quickNote, setQuickNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const fetchTip = async () => {
      const tip = await getWellnessTip();
      setWellnessTip(tip);
    };
    fetchTip();

    const loadData = async () => {
      try {
        const [incData, moodData, logData] = await Promise.all([
          dbService.getIncidents(),
          dbService.getMoods(),
          dbService.getLogs()
        ]);
        setIncidents(incData);
        setMoods(moodData);
        setLogs(logData.slice(0, 4));
        
        const today = new Date().toISOString().split('T')[0];
        const userMoodToday = moodData.find(m => m.userId === user.id && m.timestamp.startsWith(today));
        if (userMoodToday) setHasCheckedIn(true);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    return () => clearInterval(timer);
  }, [user.id]);

  const userRequests = useMemo(() => {
    return incidents.filter(i => 
      i.reporterId === user.id && 
      (i.category === IncidentCategory.COUNSELING || i.category === IncidentCategory.WELFARE)
    ).slice(0, 3);
  }, [incidents, user.id]);

  const handleMoodCheckIn = async (value: number) => {
    await dbService.logMood(user.id, value);
    const newMoods = await dbService.getMoods();
    setMoods(newMoods);
    setHasCheckedIn(true);
  };
  
  const stats = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter(i => i.status === IncidentStatus.PENDING).length;
    const resolved = incidents.filter(i => i.status === IncidentStatus.RESOLVED).length;
    
    const locationCounts = Object.values(IncidentLocation).map(loc => ({
      name: loc,
      count: incidents.filter(i => i.location === loc).length
    })).filter(l => l.count > 0).sort((a, b) => b.count - a.count);

    const wellnessTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayMoods = moods.filter(m => m.timestamp.startsWith(dateStr));
      const avg = dayMoods.length > 0 ? dayMoods.reduce((acc, curr) => acc + curr.moodValue, 0) / dayMoods.length : 3;
      return {
        date: dateStr.slice(5),
        avg: parseFloat(avg.toFixed(1))
      };
    });

    const flaggedStudents = Array.from(new Set(incidents.map(i => i.studentName)))
      .map(name => {
        const studentIncidents = incidents.filter(i => i.studentName === name);
        const latestMood = moods.filter(m => m.userId === name).sort((a,b) => b.timestamp.localeCompare(a.timestamp))[0];
        const riskScore = (studentIncidents.length * 2) + (latestMood ? (5 - latestMood.moodValue) * 3 : 0);
        return { name, riskScore, count: studentIncidents.length, latestMood: latestMood?.moodValue || 3 };
      })
      .filter(s => s.riskScore > 6)
      .sort((a,b) => b.riskScore - a.riskScore)
      .slice(0, 4);

    return { total, pending, resolved, locationCounts, wellnessTrend, flaggedStudents };
  }, [incidents, moods]);

  const submitQuickRequest = async () => {
    if (!activeQuickAction) return;
    setIsSubmitting(true);
    
    const request = {
      studentName: user.fullName,
      grade: 'Student Request',
      section: 'N/A',
      category: activeQuickAction.type,
      incidentType: IncidentType.OTHER,
      location: IncidentLocation.OFF_CAMPUS,
      description: `Student Request: ${activeQuickAction.label}. ${quickNote ? `Student Note: ${quickNote}` : 'No additional note provided.'}`,
      date: new Date().toISOString().split('T')[0],
      priority: activeQuickAction.type === IncidentCategory.WELFARE ? Priority.HIGH : Priority.MEDIUM,
      reporterId: user.id,
    };

    await dbService.saveIncident(request);
    const updatedIncidents = await dbService.getIncidents();
    setIncidents(updatedIncidents);
    
    setIsSubmitting(false);
    setActiveQuickAction(null);
    setQuickNote('');
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const moodEmojis = [
    { value: 1, emoji: '😢', label: 'Sad' },
    { value: 2, emoji: '😕', label: 'Down' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Great' },
  ];

  const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.GUIDANCE || user.role === UserRole.TEACHER;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium">Connecting to EduWatch Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Personalized Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span>{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {getTimeOfDay()}, <span className="text-blue-600">{user.fullName.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Welcome to your secure student support portal.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-end">
            <span className="text-2xl font-mono font-bold text-slate-800">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Local Time</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Wellness Tip */}
          {!isStaff && (
            <div className="bg-white p-6 rounded-3xl border border-blue-50 shadow-xl shadow-blue-50/40 relative overflow-hidden group">
              <div className="flex items-start space-x-4 relative z-10">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">AI Daily Resilience Tip</h3>
                  <p className="text-slate-700 font-medium italic">"{wellnessTip}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Wellness Check-in Widget */}
          {!isStaff && !hasCheckedIn && (
            <div className="bg-gradient-to-br from-indigo-700 to-blue-800 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold">How's your heart today?</h2>
                  <p className="text-indigo-100 mt-2 max-w-sm">A quick mood check helps your counselors understand the campus climate.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {moodEmojis.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleMoodCheckIn(m.value)}
                      className="w-16 h-16 bg-white/10 backdrop-blur-md hover:bg-white hover:text-indigo-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-90 group/btn"
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-70">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Staff Analytics Grid */}
          {isStaff && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Incidents', value: stats.total, color: 'text-slate-900', bg: 'bg-white' },
                { label: 'Unresolved', value: stats.pending, color: 'text-rose-600', bg: 'bg-rose-50/30' },
                { label: 'Avg Mood', value: stats.wellnessTrend[stats.wellnessTrend.length-1]?.avg || 0, color: 'text-blue-600', bg: 'bg-blue-50/30' }
              ].map((item, i) => (
                <div key={i} className={`${item.bg} p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-105`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                  <p className={`text-5xl font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Main Chart Area */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">Campus Wellness Pulse</h3>
              <div className="flex space-x-2">
                <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Past 7 Days</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wellnessTrendData(moods)}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis domain={[1, 5]} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorMood)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
          {!isStaff ? (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Case Tracker</h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Live</span>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                {userRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-black text-slate-900">{req.category}</div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === IncidentStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {req.status}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 italic mb-3">"{req.description}"</div>
                    <div className="text-[10px] text-slate-400 font-bold">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Early Warning Alerts */}
              <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-50/40">
                <h3 className="text-sm font-bold text-rose-800 flex items-center mb-6">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  AI Safety Alerts
                </h3>
                <div className="space-y-4">
                  {stats.flaggedStudents.map(student => (
                    <div key={student.name} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 relative group overflow-hidden">
                      <div className="flex justify-between items-center">
                        <div className="text-xs font-black text-rose-900">{student.name}</div>
                        <Link to="/incidents" className="bg-white text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">Action</Link>
                      </div>
                      <div className="mt-3 w-full bg-rose-200 h-1 rounded-full">
                        <div className="bg-rose-600 h-full rounded-full transition-all" style={{ width: `${(student.riskScore / 10) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Pulse */}
              <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 text-slate-400">Activity Pulse</h3>
                <div className="space-y-6">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-100">{log.userName}</div>
                        <div className="text-[10px] text-slate-400">{log.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Action Modal */}
      {activeQuickAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-8 ${activeQuickAction.type === IncidentCategory.WELFARE ? 'bg-rose-600' : 'bg-indigo-600'} text-white`}>
              <h3 className="text-2xl font-black">{activeQuickAction.label}</h3>
            </div>
            <div className="p-8 space-y-6">
              <textarea 
                rows={4}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Share any details..."
                className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <div className="flex space-x-4">
                <button onClick={() => setActiveQuickAction(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                <button onClick={submitQuickRequest} disabled={isSubmitting} className={`flex-1 py-4 text-white font-black rounded-2xl ${activeQuickAction.type === IncidentCategory.WELFARE ? 'bg-rose-600' : 'bg-indigo-600'} disabled:opacity-50`}>
                  {isSubmitting ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for chart data
function wellnessTrendData(moods: MoodEntry[]) {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayMoods = moods.filter(m => m.timestamp.startsWith(dateStr));
    const avg = dayMoods.length > 0 ? dayMoods.reduce((acc, curr) => acc + curr.moodValue, 0) / dayMoods.length : 3;
    return {
      date: dateStr.slice(5),
      avg: parseFloat(avg.toFixed(1))
    };
  });
}

export default Dashboard;
