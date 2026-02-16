
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { SystemAlert, AlertType } from '../types';

const AlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const refreshAlerts = () => {
    setAlerts(dbService.getAlerts());
  };

  useEffect(() => {
    refreshAlerts();
    // Listen for storage changes in other tabs
    window.addEventListener('storage', refreshAlerts);
    // Poll for changes (simulating real-time)
    const interval = setInterval(refreshAlerts, 5000);
    return () => {
      window.removeEventListener('storage', refreshAlerts);
      clearInterval(interval);
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="w-full flex flex-col">
      {alerts.map(alert => (
        <div 
          key={alert.id}
          className={`px-4 py-2 flex items-center justify-between text-sm font-bold ${
            alert.type === AlertType.EMERGENCY 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>{alert.type === AlertType.EMERGENCY ? 'EMERGENCY ALERT: ' : 'NOTICE: '} {alert.message}</span>
          </div>
          <button 
            onClick={() => {
              dbService.removeAlert(alert.id);
              refreshAlerts();
            }}
            className="opacity-70 hover:opacity-100 transition-opacity p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
