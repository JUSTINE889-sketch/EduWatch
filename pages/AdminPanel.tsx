
import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { User, ActivityLog, AlertType, SystemAlert } from '../types';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>(dbService.getUsers());
  const [logs] = useState<ActivityLog[]>(dbService.getLogs());
  const [alerts, setAlerts] = useState<SystemAlert[]>(dbService.getAlerts());
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertType, setNewAlertType] = useState<AlertType>(AlertType.INFO);

  const handleApprove = (userId: string) => {
    dbService.approveUser(userId);
    setUsers(dbService.getUsers());
  };

  const handlePostAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertMsg.trim()) return;
    dbService.addAlert({ message: newAlertMsg, type: newAlertType });
    setAlerts(dbService.getAlerts());
    setNewAlertMsg('');
  };

  const handleRemoveAlert = (id: string) => {
    dbService.removeAlert(id);
    setAlerts(dbService.getAlerts());
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Administration Panel</h1>
        <p className="text-slate-500">System management, user approvals, and audit trails.</p>
      </header>

      {/* Alert Management */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.167H3.38a1.345 1.345 0 01-1.35-1.35V10.05c0-.745.605-1.35 1.35-1.35h1.077L6.583 2.533a1.76 1.76 0 013.417.592l1.1 2.757zm5.222 5.222a3.375 3.375 0 010 4.75m2.812-7.562a6.75 6.75 0 010 10.375" /></svg>
          System Alert Broadcast
        </h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form onSubmit={handlePostAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={2}
                  value={newAlertMsg}
                  onChange={(e) => setNewAlertMsg(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
                  placeholder="Enter broadcast message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alert Type</label>
                <select
                  value={newAlertType}
                  onChange={(e) => setNewAlertType(e.target.value as AlertType)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200"
                >
                  <option value={AlertType.INFO}>General Notice</option>
                  <option value={AlertType.EMERGENCY}>Emergency Alert</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Broadcast Now
              </button>
            </form>
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Broadcasts</h3>
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className={`p-3 rounded-lg border flex items-center justify-between ${a.type === AlertType.EMERGENCY ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase mr-2 ${a.type === AlertType.EMERGENCY ? 'text-red-700' : 'text-blue-700'}`}>{a.type}</span>
                    <span className="text-sm text-slate-700">{a.message}</span>
                  </div>
                  <button onClick={() => handleRemoveAlert(a.id)} className="text-slate-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm text-slate-400 italic">No active alerts.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* User Approvals */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Account Approval System
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role Requested</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {u.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!u.isApproved && (
                      <button 
                        onClick={() => handleApprove(u.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded-lg bg-blue-50"
                      >
                        Approve Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Logs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Activity Logs (Audit Trail)
        </h2>
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-slate-300">
          <div className="p-4 bg-slate-800 text-xs font-mono flex justify-between">
            <span>AUDIT_LOG_EXPORT_V1.0</span>
            <span>SYSTEM_READY</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 text-slate-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-slate-500 uppercase">Action Taken</th>
                  <th className="px-6 py-3 text-slate-500 uppercase">Object ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-3 whitespace-nowrap text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-3 text-blue-400">{log.userName}</td>
                    <td className="px-6 py-3">{log.action}</td>
                    <td className="px-6 py-3 text-slate-500">{log.targetId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
