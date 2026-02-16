
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, ActivityLog, AlertType, SystemAlert } from '../types';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertType, setNewAlertType] = useState<AlertType>(AlertType.INFO);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [userData, logData, alertData] = await Promise.all([
        dbService.getUsers(),
        dbService.getLogs(),
        dbService.getAlerts()
      ]);
      setUsers(userData);
      setLogs(logData);
      setAlerts(alertData);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    await dbService.approveUser(userId);
    const updatedUsers = await dbService.getUsers();
    setUsers(updatedUsers);
  };

  const handlePostAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertMsg.trim()) return;
    await dbService.addAlert({ message: newAlertMsg, type: newAlertType });
    const updatedAlerts = await dbService.getAlerts();
    setAlerts(updatedAlerts);
    setNewAlertMsg('');
  };

  const handleRemoveAlert = async (id: string) => {
    await dbService.removeAlert(id);
    const updatedAlerts = await dbService.getAlerts();
    setAlerts(updatedAlerts);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium">Fetching system data...</p>
      </div>
    );
  }

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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-inner"
                  placeholder="Enter broadcast message..."
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                Broadcast Now
              </button>
            </form>
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Broadcasts</h3>
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="p-3 rounded-lg border bg-blue-50 border-blue-100 flex items-center justify-between">
                  <span className="text-sm text-slate-700">{a.message}</span>
                  <button onClick={() => handleRemoveAlert(a.id)} className="text-slate-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.role}</td>
                  <td className="px-6 py-4">
                    {!u.isApproved && (
                      <button onClick={() => handleApprove(u.id)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Approve</button>
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
        <h2 className="text-lg font-bold text-slate-800">Activity Logs</h2>
        <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 font-mono text-xs overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 text-blue-400">{log.userName}</td>
                  <td className="px-4 py-2">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
