
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import { getResourceRecommendation } from '../services/geminiService';
import { Link } from 'react-router-dom';

const SupportResources: React.FC = () => {
  const [recommendation, setRecommendation] = useState<{recommendedResource: string, reason: string} | null>(null);
  const [activeResource, setActiveResource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mindfulness State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const breathIntervalRef = useRef<number | null>(null);

  const savedSession = localStorage.getItem('eduwatch_session');
  const user = savedSession ? JSON.parse(savedSession) : null;

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user) return;
      setIsLoading(true);
      // Fixed: Await getMoods() since it returns a Promise<MoodEntry[]>
      const allMoods = await dbService.getMoods();
      const moods = allMoods.filter(m => m.userId === user.id);
      const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b.moodValue, 0) / moods.length : 3;
      
      // Fixed: Await getIncidents() since it returns a Promise<IncidentReport[]>
      const allIncidents = await dbService.getIncidents();
      const recentIncidents = allIncidents
        .filter(i => i.reporterId === user.id)
        .slice(0, 3)
        .map(i => i.incidentType);
      
      const rec = await getResourceRecommendation(avgMood, recentIncidents);
      setRecommendation(rec);
      setIsLoading(false);
    };
    fetchRecs();
  }, []);

  // Breathing Logic
  useEffect(() => {
    if (isBreathing) {
      breathIntervalRef.current = window.setInterval(() => {
        setBreathTimer(prev => {
          if (prev <= 1) {
            setBreathPhase(current => {
              if (current === 'Inhale') return 'Hold';
              if (current === 'Hold') return 'Exhale';
              if (current === 'Exhale') return 'Pause';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      setBreathTimer(4);
      setBreathPhase('Inhale');
    }
    return () => { if (breathIntervalRef.current) clearInterval(breathIntervalRef.current); };
  }, [isBreathing]);

  const resources = [
    { id: '1', title: 'Emergency Contacts', emoji: '☎️', content: 'National Youth Hotline: 1-800-SAFE. Guidance Ext. 402.' },
    { id: '2', title: 'Upstander Guide', emoji: '🤝', content: 'Learn how to support peers safely and report concerns without fear.' },
    { id: '3', title: 'Digital Responsibility', emoji: '🛡️', content: 'Guidelines for empathetic online communication and cyber-safety.' },
    { id: '4', title: 'Mindfulness Exercises', emoji: '🧘', content: 'Simple 4-count breathing techniques to manage school stress.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Ecosystem</h1>
        <p className="text-slate-500 mt-2">Personalized guidance and critical school resources.</p>
      </header>

      {/* AI Personalized Recommendation */}
      {recommendation && (
        <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center gap-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
            💡
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">AI Recommendation for {user?.fullName.split(' ')[0]}</div>
            <h2 className="text-xl font-bold">Suggested: {recommendation.recommendedResource}</h2>
            <p className="text-blue-100 mt-1 text-sm">{recommendation.reason}</p>
          </div>
          <button 
            onClick={() => setActiveResource(recommendation.recommendedResource)}
            className="px-6 py-3 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Open Module
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map(res => (
          <button 
            key={res.id} 
            onClick={() => setActiveResource(res.title)}
            className="text-left bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group hover:shadow-lg hover:border-blue-100 transition-all active:scale-95"
          >
            {recommendation?.recommendedResource === res.title && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                RECOMMENDED
              </div>
            )}
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              {res.emoji}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{res.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{res.content}</p>
          </button>
        ))}
      </div>

      {/* Resource Modal */}
      {activeResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{activeResource}</h3>
              <button onClick={() => { setActiveResource(null); setIsBreathing(false); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {/* Emergency Contacts View */}
              {activeResource === 'Emergency Contacts' && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                    <h4 className="text-red-800 font-bold mb-4 flex items-center">
                       <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                       Immediate Assistance
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-red-50">
                        <div>
                          <div className="font-bold text-slate-800">Campus Guidance Office</div>
                          <div className="text-xs text-slate-500">Available Mon-Fri, 7am-4pm</div>
                        </div>
                        <a href="tel:402" className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700">Dial Ext. 402</a>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-red-50">
                        <div>
                          <div className="font-bold text-slate-800">National SafeLine</div>
                          <div className="text-xs text-slate-500">24/7 Confidential Support</div>
                        </div>
                        <a href="tel:18007233" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 tracking-tighter">1-800-SAFE</a>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">School Welfare Policy</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      If you are in immediate danger on campus, use any wall-mounted blue phone or contact the nearest staff member. Your safety is our primary mission.
                    </p>
                  </div>
                </div>
              )}

              {/* Upstander Guide View */}
              {activeResource === 'Upstander Guide' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { t: 'Distract', d: 'Interrupt the situation by asking the target a random question.', c: 'bg-blue-50 text-blue-700' },
                      { t: 'Delegate', d: 'Find a teacher or administrator to handle the incident.', c: 'bg-green-50 text-green-700' },
                      { t: 'Direct', d: 'Speak up firmly but calmly: "That\'s not cool, stop."', c: 'bg-orange-50 text-orange-700' },
                      { t: 'Delay', d: 'Check in with the target after the incident to offer support.', c: 'bg-purple-50 text-purple-700' }
                    ].map((step, idx) => (
                      <div key={idx} className={`${step.c} p-4 rounded-2xl border border-current/10`}>
                        <div className="font-bold text-sm mb-1">{step.t}</div>
                        <div className="text-[11px] leading-tight opacity-80">{step.d}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-4">
                     <p className="text-xs text-slate-400 mb-4 italic">Witnessed something? Help keep our school safe.</p>
                     <Link 
                       to="/report" 
                       onClick={() => setActiveResource(null)}
                       className="inline-block bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                     >
                       Submit a Witness Report
                     </Link>
                  </div>
                </div>
              )}

              {/* Digital Responsibility View */}
              {activeResource === 'Digital Responsibility' && (
                <div className="space-y-6">
                  <h4 className="text-center font-bold text-slate-800 text-lg">Before you post or send, T.H.I.N.K.</h4>
                  <div className="space-y-3">
                    {[
                      { l: 'T', w: 'True', d: 'Is this information factually accurate?' },
                      { l: 'H', w: 'Helpful', d: 'Will this make someone\'s day better or worse?' },
                      { l: 'I', w: 'Inspiring', d: 'Does this contribute positively to our culture?' },
                      { l: 'N', w: 'Necessary', d: 'Does this actually need to be said?' },
                      { l: 'K', w: 'Kind', d: 'Would you say this to their face?' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl">{item.l}</div>
                        <div>
                          <div className="font-bold text-slate-900">{item.w}</div>
                          <div className="text-xs text-slate-500">{item.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mindfulness View */}
              {activeResource === 'Mindfulness Exercises' && (
                <div className="flex flex-col items-center justify-center space-y-12 py-4">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Animated Circle */}
                    <div className={`absolute inset-0 border-4 border-blue-100 rounded-full transition-all duration-1000 ${isBreathing ? (breathPhase === 'Inhale' ? 'scale-125 opacity-100' : breathPhase === 'Exhale' ? 'scale-100 opacity-100' : 'scale-110 opacity-50') : 'scale-100 opacity-20'}`}></div>
                    <div className={`w-32 h-32 bg-blue-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl shadow-blue-100 transition-all duration-1000 ${isBreathing && breathPhase === 'Inhale' ? 'scale-110' : 'scale-100'}`}>
                      {isBreathing ? (
                        <>
                          <span className="text-xl font-black">{breathPhase}</span>
                          <span className="text-4xl font-mono mt-1">{breathTimer}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold uppercase tracking-widest">Ready?</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center max-w-xs">
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                      Box breathing is a simple technique used to regulate the nervous system. Follow the cues for 4 seconds each.
                    </p>
                    <button 
                      onClick={() => setIsBreathing(!isBreathing)}
                      className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${isBreathing ? 'bg-red-500 shadow-red-100' : 'bg-slate-900 shadow-slate-100'}`}
                    >
                      {isBreathing ? 'Stop Session' : 'Start Box Breathing'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              EduWatch Wellness Module v1.2
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 p-8 rounded-3xl text-white">
        <h3 className="text-xl font-bold mb-4">Welfare Policy</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Our school maintains a zero-tolerance policy towards retaliation. Every report submitted through EduWatch is processed via an encrypted channel. Staff are trained to prioritize safety, confidentiality, and objective mediation.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/10">Encrypted Data</div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/10">Zero Judgment</div>
          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/10">Immediate Response</div>
        </div>
      </div>
    </div>
  );
};

export default SupportResources;
