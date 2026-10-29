/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Send, 
  AlertOctagon, 
  Mail, 
  MessageSquare, 
  UserPlus, 
  History, 
  ToggleLeft, 
  ToggleRight,
  Clock,
  Trash2,
  Info,
  CheckCircle2,
  Radio
} from 'lucide-react';

interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  isActive: boolean;
}

interface SentNotification {
  id: string;
  timestamp: string;
  recipientName: string;
  recipientContact: string;
  type: 'EMAIL' | 'SMS' | 'BOTH';
  status: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  standoff: number;
  details: string;
}

interface AlertMonitorDashboardProps {
  Vsw: number;
  Bz: number;
  Nsw: number;
  P_dyn: number;
  Kp: number;
  r0: number;
  predicted30m: { flux: number; risk: string };
  predicted6h: { flux: number; risk: string };
  predicted12h: { flux: number; risk: string };
  addLog: (msg: string) => void;
  activeSatelliteName: string;
}

export default function AlertMonitorDashboard({
  Vsw,
  Bz,
  Nsw,
  P_dyn,
  Kp,
  r0,
  predicted30m,
  predicted6h,
  predicted12h,
  addLog,
  activeSatelliteName
}: AlertMonitorDashboardProps) {
  // Core States
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [notifications, setNotifications] = useState<SentNotification[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoDispatch, setAutoDispatch] = useState(true);

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('');

  // Local dispatch state
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Initialize Users and Sent log from localStorage on mount
  useEffect(() => {
    const cachedUsers = localStorage.getItem('orion_alert_users') || localStorage.getItem('astroshield_users');
    const cachedLogs = localStorage.getItem('orion_alert_logs') || localStorage.getItem('astroshield_notif_logs');

    if (cachedUsers) {
      setUsers(JSON.parse(cachedUsers));
    } else {
      const defaultUsers: AuthorizedUser[] = [
        {
          id: '1',
          name: 'Dr. Abu Jar Nadaf',
          email: 'abujarnadaf001@gmail.com',
          mobile: '+919999999999',
          designation: 'Space Weather Research Lead',
          isActive: true
        },
        {
          id: '2',
          name: 'Dr. G. Madhavan',
          email: 'g.madhavan.isro@gmail.com',
          mobile: '+919876543210',
          designation: 'Spacecraft Charging Specialist',
          isActive: true
        }
      ];
      setUsers(defaultUsers);
      localStorage.setItem('orion_alert_users', JSON.stringify(defaultUsers));
    }

    if (cachedLogs) {
      setNotifications(JSON.parse(cachedLogs));
    } else {
      setNotifications([]);
    }
  }, []);

  const saveUsersToStorage = (updatedUsers: AuthorizedUser[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('orion_alert_users', JSON.stringify(updatedUsers));
  };

  const saveLogsToStorage = (updatedLogs: SentNotification[]) => {
    setNotifications(updatedLogs);
    localStorage.setItem('orion_alert_logs', JSON.stringify(updatedLogs));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile) return;

    const newUser: AuthorizedUser = {
      id: Date.now().toString(),
      name,
      email,
      mobile,
      designation: designation || 'Operations Engineer',
      isActive: true
    };

    const updated = [...users, newUser];
    saveUsersToStorage(updated);
    addLog(`ORION Alert Network authorized: ${name}`);

    // Reset Form
    setName('');
    setEmail('');
    setMobile('');
    setDesignation('');
    setShowAddForm(false);
  };

  const handleDeleteUser = (id: string, userName: string) => {
    const updated = users.filter(u => u.id !== id);
    saveUsersToStorage(updated);
    addLog(`Deauthorized personnel: ${userName}`);
  };

  const toggleUserActive = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u);
    saveUsersToStorage(updated);
  };

  // Automated trigger effect when standoff compresses past 6.6
  const [criticalTriggered, setCriticalTriggered] = useState(false);
  useEffect(() => {
    if (r0 < 6.6) {
      if (!criticalTriggered) {
        setCriticalTriggered(true);
        addLog(`⚠️ CRITICAL COLLAPSE: Magnetopause compressed past geostationary threshold (${r0.toFixed(2)} Re < 6.6 Re)!`);
        
        if (autoDispatch) {
          triggerAlertDispatch('AUTOMATED REAL-TIME CRITICAL EXCURSION');
        }
      }
    } else {
      if (criticalTriggered) {
        setCriticalTriggered(false);
        addLog(`☀️ RECOVERY: Magnetopause standoff returned to safe boundary (${r0.toFixed(2)} Re).`);
      }
    }
  }, [r0, autoDispatch]);

  const triggerAlertDispatch = async (triggerSource = 'MANUAL DISPATCH COMMAND') => {
    setIsDispatching(true);
    setDispatchStatus('In Progress...');
    addLog(`Initiating ORION multi-channel alert payload dispatch...`);

    const activeRecipients = users.filter(u => u.isActive);
    if (activeRecipients.length === 0) {
      setDispatchStatus('No active authorized recipients present.');
      setIsDispatching(false);
      return;
    }

    try {
      const response = await fetch('/api/alerts/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerSource,
          Vsw,
          Bz,
          Nsw,
          P_dyn,
          Kp,
          r0,
          predicted30m,
          predicted6h,
          predicted12h,
          satelliteName: activeSatelliteName,
          recipients: activeRecipients.map(u => ({
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            designation: u.designation
          }))
        })
      });

      const result = await response.json();

      // Log items to local status
      const newLogs: SentNotification[] = [];
      result.results?.forEach((item: any) => {
        newLogs.push({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          recipientName: item.recipientName,
          recipientContact: `${item.email} / ${item.mobile}`,
          type: 'BOTH',
          status: item.status === 'success' ? 'DELIVERED' : item.status === 'simulated' ? 'SIMULATED' : 'FAILED',
          standoff: r0,
          details: item.summary || 'ORION space weather alert dispatched.'
        });
      });

      const updatedLogs = [...newLogs, ...notifications].slice(0, 40);
      saveLogsToStorage(updatedLogs);

      if (result.isSimulated) {
        setDispatchStatus('Simulated Delivery Recorded');
        addLog(`Dispatched simulation notifications to ${activeRecipients.length} operators.`);
      } else {
        setDispatchStatus('Live Alerts Delivered');
        addLog(`Live dispatch completed to ${activeRecipients.length} operators via Twilio/SMTP.`);
      }
    } catch (err: any) {
      console.error(err);
      setDispatchStatus('Dispatch failed. Server connection error.');
      addLog(`Failed to communicate with alert notification dispatch router: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const isExcursion = r0 < 6.6;

  return (
    <div className="flex flex-col gap-4 h-full font-sans text-xs text-[#252923] dark:text-[#E5E9E4]">
      
      {/* Alert Header Status Panel */}
      <div 
        className={`p-3.5 border rounded-xl transition-all duration-300 flex items-center justify-between ${
          isExcursion 
            ? 'bg-[#B94A48]/10 border-[#B94A48]/30 text-[#B94A48]' 
            : 'bg-[#437A5B]/10 border-[#437A5B]/30 text-[#437A5B]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <AlertOctagon className={`h-5 w-5 shrink-0 ${isExcursion ? 'text-[#B94A48] animate-pulse' : 'text-[#437A5B]'}`} />
          <div>
            <div className="font-semibold text-xs uppercase tracking-wider">
              {isExcursion ? 'Critical Magnetopause Excursion Warning' : 'Geostationary Standoff Secure'}
            </div>
            <div className="text-[10px] opacity-80">
              {isExcursion 
                ? 'Solar wind dynamic compression exceeds geosynchronous threshold' 
                : 'Spacecraft orbit remains protected inside Earth magnetosphere'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-bold">{r0.toFixed(2)} Re</span>
          <div className="text-[9px] opacity-75">Limit: 6.60 Re</div>
        </div>
      </div>

      {/* Grid: Recipient Management & Dispatch Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Recipient manager */}
        <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-4 rounded-xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-2.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-[#252923] dark:text-[#E5E9E4]">
              <Users className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
              <span>Authorized Duty Engineers</span>
            </div>
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] text-[#252923] dark:text-[#E5E9E4] hover:bg-[#E5E5DD] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#A88B62]" />
              <span>{showAddForm ? 'Cancel' : 'Add Contact'}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddUser} className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-[#A88B62] uppercase tracking-wider">New Recipient Details</span>
              <input 
                type="text" 
                placeholder="Full Name (e.g. Dr. Jane Doe)" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-1.5 px-2.5 rounded text-xs outline-none focus:border-[#A88B62]"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-1.5 px-2.5 rounded text-xs outline-none focus:border-[#A88B62]"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Mobile (+91...)" 
                  value={mobile} 
                  onChange={e => setMobile(e.target.value)}
                  className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-1.5 px-2.5 rounded text-xs outline-none focus:border-[#A88B62]"
                  required
                />
              </div>
              <input 
                type="text" 
                placeholder="Designation / Organization" 
                value={designation} 
                onChange={e => setDesignation(e.target.value)}
                className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-1.5 px-2.5 rounded text-xs outline-none focus:border-[#A88B62]"
              />
              <button 
                type="submit" 
                className="w-full bg-[#35473C] text-white hover:bg-[#27352D] rounded py-1.5 font-medium text-xs transition-colors cursor-pointer"
              >
                Save Recipient
              </button>
            </form>
          )}

          {/* User List */}
          <div className="flex flex-col gap-2 max-h-[175px] overflow-y-auto pr-1">
            {users.length === 0 ? (
              <div className="text-xs text-[#777B70] italic text-center py-4">No authorized recipients registered.</div>
            ) : (
              users.map(u => (
                <div key={u.id} className="p-2.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#252923] dark:text-[#E5E9E4] truncate">{u.name}</span>
                      <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] shrink-0">· {u.designation}</span>
                    </div>
                    <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-mono truncate">
                      {u.email} · {u.mobile}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => toggleUserActive(u.id)}
                      className="p-1 text-[#777B70] hover:text-[#252923] dark:hover:text-white cursor-pointer"
                      title={u.isActive ? "Deactivate alerts" : "Activate alerts"}
                    >
                      {u.isActive ? (
                        <ToggleRight className="h-5 w-5 text-[#35473C] dark:text-[#A8B3A0]" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-[#777B70]" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1 text-[#777B70] hover:text-[#B94A48] cursor-pointer transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dispatch Controls & Status */}
        <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-4 rounded-xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-2.5 font-semibold text-xs text-[#252923] dark:text-[#E5E9E4]">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
              <span>Broadcast Dispatcher</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-normal">
              <span className="text-[#777B70] dark:text-[#8F998E]">Auto-Dispatch:</span>
              <button 
                onClick={() => {
                  setAutoDispatch(!autoDispatch);
                  addLog(`Auto-dispatcher ${!autoDispatch ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  autoDispatch 
                    ? 'bg-[#35473C] text-white' 
                    : 'bg-[#E5E5DD] dark:bg-[#2B332E] text-[#777B70] dark:text-[#8F998E]'
                }`}
              >
                {autoDispatch ? 'Active' : 'Standby'}
              </button>
            </div>
          </div>

          <p className="text-xs text-[#777B70] dark:text-[#8F998E] leading-relaxed">
            Broadcast space weather event payloads to all active registered personnel via SMS, Email, and webhooks.
          </p>

          <div className="grid grid-cols-2 gap-2 my-1">
            <button
              type="button"
              onClick={() => triggerAlertDispatch('MANUAL CONSOLE DISPATCH')}
              disabled={isDispatching}
              className="w-full bg-[#35473C] hover:bg-[#27352D] disabled:opacity-50 py-2 rounded-lg font-medium text-white cursor-pointer transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isDispatching ? 'Dispatching...' : 'Dispatch Alert'}</span>
            </button>

            <div className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Channel Status</span>
              <span className="text-xs font-semibold truncate text-[#252923] dark:text-[#E5E9E4]">
                {dispatchStatus || 'Ready for Broadcast'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#777B70] dark:text-[#8F998E] bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-2.5 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-[#A88B62] shrink-0 mt-0.5" />
            <div className="leading-snug">
              Simulation mode active by default. Live SMS & Email dispatch can be activated with Twilio and SMTP credentials in server configuration.
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Payload Preview */}
      <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-4 rounded-xl shadow-sm flex flex-col gap-3">
        <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-2 font-semibold text-xs text-[#252923] dark:text-[#E5E9E4] flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
          <span>Alert Channel Payload Previews</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* SMS Preview */}
          <div className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg flex flex-col gap-1.5">
            <span className="text-[10px] text-[#A88B62] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>SMS Channel Output</span>
            </span>
            <div className="p-2.5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] rounded text-[10px] font-mono text-[#252923] dark:text-[#E5E9E4] whitespace-pre-line max-h-[140px] overflow-y-auto leading-relaxed">
{`🚨 ORION SPACE WEATHER ALERT
STATION: ORION GEO OBSERVATORY
TARGET: ${activeSatelliteName}
STATUS: ${isExcursion ? 'CRITICAL EXCURSION WARNING' : 'STANDOFF SECURE'}

Magnetopause Boundary: ${r0.toFixed(2)} Re (${isExcursion ? 'COLLAPSED below 6.6 Re limit' : 'Nominal'})
Solar Wind Velocity: ${Vsw.toFixed(0)} km/s
IMF Bz: ${Bz.toFixed(1)} nT
Solar Plasma: ${Nsw.toFixed(1)} cm⁻³
Dynamic Pressure: ${P_dyn.toFixed(2)} nPa

FORECAST MATRIX (RADIATION FLUX):
- T+30M: ${predicted30m.flux.toFixed(0)} (${predicted30m.risk})
- T+6H: ${predicted6h.flux.toFixed(0)} (${predicted6h.risk})
- T+12H: ${predicted12h.flux.toFixed(0)} (${predicted12h.risk})`}
            </div>
          </div>

          {/* Email Preview */}
          <div className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg flex flex-col gap-1.5">
            <span className="text-[10px] text-[#A88B62] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>Email Notification Output</span>
            </span>
            <div className="p-2.5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] rounded text-[10.5px] font-sans text-[#252923] dark:text-[#E5E9E4] leading-relaxed max-h-[140px] overflow-y-auto flex flex-col gap-1">
              <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-1 text-[11px] font-medium">
                Subject: <span className="font-semibold text-[#B94A48]">ORION Space Weather Excursion Notice: {activeSatelliteName}</span>
              </div>
              <p className="font-semibold text-[#252923] dark:text-[#E5E9E4]">Dear Duty Operations Engineer,</p>
              <p className="text-[11px] text-[#777B70] dark:text-[#8F998E]">
                Automated advisory generated by ORION Geostationary Space Weather Observatory. Magnetopause standoff is calculated at <strong>{r0.toFixed(2)} Re</strong> relative to the 6.60 Re orbital shell.
              </p>
              <div className="text-[10px] font-mono text-[#777B70] dark:text-[#8F998E] bg-[#F6F5F0] dark:bg-[#232A26] p-1.5 rounded">
                Vsw: {Vsw.toFixed(0)} km/s · Bz: {Bz.toFixed(1)} nT · P_dyn: {P_dyn.toFixed(2)} nPa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of Sent alerts list */}
      <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-4 rounded-xl shadow-sm flex flex-col gap-3">
        <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-2 font-semibold text-xs text-[#252923] dark:text-[#E5E9E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
            <span>Broadcast Event Log</span>
          </div>
          {notifications.length > 0 && (
            <button 
              onClick={() => saveLogsToStorage([])}
              className="text-[11px] text-[#777B70] hover:text-[#B94A48] cursor-pointer"
            >
              Clear Log History
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-xs text-[#777B70] italic text-center py-4">No broadcast dispatches recorded in this session.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-2.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#252923] dark:text-[#E5E9E4]">{n.recipientName}</span>
                    <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-mono">{n.recipientContact}</span>
                  </div>
                  <p className="text-[10.5px] text-[#777B70] dark:text-[#8F998E] leading-relaxed">{n.details}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-[10px] text-[#777B70] font-mono">{n.timestamp}</span>
                  <span className={`text-[10px] font-mono uppercase font-semibold ${
                    n.status === 'DELIVERED' 
                      ? 'text-[#437A5B]' 
                      : n.status === 'SIMULATED'
                      ? 'text-[#A88B62]'
                      : 'text-[#B94A48]'
                  }`}>
                    {n.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
