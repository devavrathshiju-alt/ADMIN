import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Download, 
  Trophy,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Event {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface CR {
  id: number;
  name: string;
  class_name: string;
  referral_code: string;
}

interface LeaderboardItem {
  name: string;
  class_name: string;
  referral_code: string;
  count: number;
}

interface Registration {
  id: number;
  student_name: string;
  roll_number: string;
  email: string;
  event_name: string;
  cr_name: string;
  class_name: string;
  timestamp: string;
}

interface AdminDashboardProps {
  token: string;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'crs' | 'analytics'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [crs, setCrs] = useState<CR[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  // Form states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCRModal, setShowCRModal] = useState(false);
  const [eventForm, setEventForm] = useState({ name: '', date: '', status: 'active' });
  const [crForm, setCrForm] = useState({ name: '', class_name: '', referral_code: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [eventsRes, crsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/crs')
      ]);
      const eventsData = await eventsRes.json();
      const crsData = await crsRes.json();
      setEvents(eventsData);
      setCrs(crsData);
      if (eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEventId && activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [selectedEventId, activeTab]);

  const fetchAnalytics = async () => {
    if (!selectedEventId) return;
    try {
      const [leaderboardRes, registrationsRes] = await Promise.all([
        fetch(`/api/analytics/leaderboard/${selectedEventId}`),
        fetch(`/api/analytics/registrations/${selectedEventId}`)
      ]);
      setLeaderboard(await leaderboardRes.json());
      setRegistrations(await registrationsRes.json());
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/events/${editingId}` : '/api/events';
    const method = editingId ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventForm)
    });
    
    setShowEventModal(false);
    setEditingId(null);
    setEventForm({ name: '', date: '', status: 'active' });
    fetchData();
  };

  const handleCRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/crs/${editingId}` : '/api/crs';
    const method = editingId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(crForm)
    });
    
    if (res.ok) {
      setShowCRModal(false);
      setEditingId(null);
      setCrForm({ name: '', class_name: '', referral_code: '' });
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to save CR');
    }
  };

  const deleteItem = async (type: 'events' | 'crs', id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await fetch(`/api/${type}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const exportToCSV = () => {
    if (registrations.length === 0) return;
    const headers = ['Student Name', 'Roll Number', 'Email', 'Event', 'CR Name', 'Class', 'Timestamp'];
    const rows = registrations.map(r => [
      r.student_name,
      r.roll_number,
      r.email,
      r.event_name,
      r.cr_name,
      r.class_name,
      new Date(r.timestamp).toLocaleString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registrations_event_${selectedEventId}.csv`;
    link.click();
  };

  const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Manage your IEEE events and track referral performance.</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Calendar size={18} />
            Events
          </button>
          <button 
            onClick={() => setActiveTab('crs')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'crs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users size={18} />
            CRs
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'events' && (
          <motion.div 
            key="events"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingId(null); setEventForm({ name: '', date: '', status: 'active' }); setShowEventModal(true); }}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
              >
                <Plus size={18} />
                Create Event
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Event Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map(event => (
                    <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${event.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {event.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingId(event.id); setEventForm({ name: event.name, date: event.date, status: event.status }); setShowEventModal(true); }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteItem('events', event.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No events found. Create one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'crs' && (
          <motion.div 
            key="crs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingId(null); setCrForm({ name: '', class_name: '', referral_code: '' }); setShowCRModal(true); }}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
              >
                <Plus size={18} />
                Add CR
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {crs.map(cr => (
                <div key={cr.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Users size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingId(cr.id); setCrForm({ name: cr.name, class_name: cr.class_name, referral_code: cr.referral_code }); setShowCRModal(true); }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteItem('crs', cr.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{cr.name}</h3>
                  <p className="text-sm text-slate-500">{cr.class_name}</p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Link Identifier</p>
                      <p className="font-mono text-lg font-bold text-indigo-600">{cr.referral_code}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <LinkCopyButton code={cr.referral_code} />
                      <Link 
                        to={`/cr/${cr.referral_code}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-indigo-600"
                      >
                        <ExternalLink size={14} />
                        View Dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {crs.length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-500">
                  No Class Representatives added yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-xs">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={selectedEventId || ''} 
                  onChange={(e) => setSelectedEventId(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={exportToCSV}
                disabled={registrations.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Leaderboard Chart */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Registration Trends</h3>
                  <Trophy className="text-amber-500" size={24} />
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaderboard}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="referral_code" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {leaderboard.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-900">Leaderboard</h3>
                <div className="space-y-4">
                  {leaderboard.map((item, index) => (
                    <div key={item.referral_code} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-400 border border-slate-200'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            {index === 0 && item.count > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <Trophy size={10} />
                                WINNER
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{item.class_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{item.count}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Registrations</p>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="py-8 text-center text-slate-500 italic">No registration data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Registrations Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="font-bold text-slate-900">Recent Registrations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Roll No</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Referral</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {registrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{reg.student_name}</p>
                          <p className="text-xs text-slate-500">{reg.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{reg.roll_number}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-indigo-600">{reg.cr_name}</p>
                          <p className="text-[10px] text-slate-400">{reg.class_name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(reg.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No registrations found for this event.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Modal */}
      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title={editingId ? 'Edit Event' : 'Create Event'}>
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Event Name</label>
            <input 
              required
              type="text" 
              value={eventForm.name} 
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Workshop on AI"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Event Date</label>
            <input 
              required
              type="date" 
              value={eventForm.date} 
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select 
              value={eventForm.status} 
              onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-700">
            {editingId ? 'Update Event' : 'Create Event'}
          </button>
        </form>
      </Modal>

      {/* CR Modal */}
      <Modal isOpen={showCRModal} onClose={() => setShowCRModal(false)} title={editingId ? 'Edit CR' : 'Add CR'}>
        <form onSubmit={handleCRSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">CR Name</label>
            <input 
              required
              type="text" 
              value={crForm.name} 
              onChange={(e) => setCrForm({ ...crForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Class Name</label>
            <input 
              required
              type="text" 
              value={crForm.class_name} 
              onChange={(e) => setCrForm({ ...crForm, class_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="CSE 3A"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Link Identifier (Unique)</label>
            <input 
              required
              type="text" 
              value={crForm.referral_code} 
              onChange={(e) => setCrForm({ ...crForm, referral_code: e.target.value.toUpperCase().replace(/\s/g, '') })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="CSE3A"
            />
            <p className="text-[10px] text-slate-500 italic">This will be used to generate the unique registration link.</p>
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-700">
            {editingId ? 'Update CR' : 'Add CR'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><XCircle size={24} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function LinkCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/register?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={copy}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${copied ? 'text-emerald-600' : 'text-indigo-600 hover:text-indigo-700'}`}
    >
      {copied ? <CheckCircle2 size={14} /> : <QrCode size={14} />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

function Link({ to, children, target, className }: { to: string, children: React.ReactNode, target?: string, className?: string }) {
  return (
    <a href={to} target={target} className={className} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  );
}
