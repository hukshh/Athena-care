import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, Building2, Brain, TrendingUp, Shield,
  Search, Trash2, Eye, MoreVertical, Activity, AlertTriangle,
  CheckCircle, Clock, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import AppLayout from '../../components/layout/AppLayout';

const usageData = [
  { date: 'Dec 10', users: 120, reports: 45, matches: 89 },
  { date: 'Dec 11', users: 145, reports: 62, matches: 110 },
  { date: 'Dec 12', users: 132, reports: 58, matches: 95 },
  { date: 'Dec 13', users: 178, reports: 71, matches: 134 },
  { date: 'Dec 14', users: 195, reports: 88, matches: 156 },
  { date: 'Dec 15', users: 210, reports: 95, matches: 178 },
  { date: 'Dec 16', users: 248, reports: 112, matches: 201 },
];

const mockUsers = [
  { id: '1', name: 'Sarah Mitchell', email: 'sarah@example.com', country: 'USA', reports: 3, status: 'active', joined: '2024-12-01' },
  { id: '2', name: 'James Okonkwo', email: 'james@example.com', country: 'Nigeria', reports: 5, status: 'active', joined: '2024-11-28' },
  { id: '3', name: 'Elena Vasquez', email: 'elena@example.com', country: 'Spain', reports: 2, status: 'inactive', joined: '2024-12-10' },
  { id: '4', name: 'Ahmed Al-Rashid', email: 'ahmed@example.com', country: 'UAE', reports: 7, status: 'active', joined: '2024-11-15' },
  { id: '5', name: 'Liu Wei', email: 'liu@example.com', country: 'China', reports: 4, status: 'active', joined: '2024-12-05' },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'ai', label: 'AI Usage', icon: Brain },
  ];

  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-sky-400" />
              Admin Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">Platform management and analytics</p>
          </div>
          <span className="badge-red flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Admin Access
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: '52,840', change: '+12%', icon: Users, color: 'from-sky-500 to-blue-600' },
                { label: 'Reports Processed', value: '184,200', change: '+28%', icon: FileText, color: 'from-violet-500 to-purple-600' },
                { label: 'AI Matches Made', value: '96,500', change: '+35%', icon: Brain, color: 'from-emerald-500 to-teal-600' },
                { label: 'Revenue (MRR)', value: '$284K', change: '+18%', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{stat.label}</span>
                    <span className="text-emerald-400 text-xs">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Chart */}
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-6">Platform Usage (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="matchesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Area type="monotone" dataKey="users" stroke="#0ea5e9" fill="url(#usersGrad)" strokeWidth={2} name="Active Users" />
                  <Area type="monotone" dataKey="matches" stroke="#8b5cf6" fill="url(#matchesGrad)" strokeWidth={2} name="AI Matches" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Search users..."
                />
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    {['User', 'Country', 'Reports', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{user.name}</div>
                            <div className="text-slate-500 text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{user.country}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{user.reports}</td>
                      <td className="px-4 py-3">
                        <span className={user.status === 'active' ? 'badge-green' : 'badge-yellow'}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{user.joined}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-slate-500 hover:text-sky-400 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* AI Usage Tab */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Total API Calls', value: '2.4M', sub: 'This month', color: 'text-sky-400' },
                { label: 'Avg Response Time', value: '1.2s', sub: 'RAG queries', color: 'text-emerald-400' },
                { label: 'Model Accuracy', value: '98.2%', sub: 'Match precision', color: 'text-violet-400' },
              ].map((item) => (
                <div key={item.label} className="glass-card p-5">
                  <div className={`text-3xl font-bold ${item.color} mb-1`}>{item.value}</div>
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  <div className="text-slate-500 text-xs">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">AI Feature Usage</h3>
              <div className="space-y-3">
                {[
                  { feature: 'Hospital Matching Engine', calls: 45200, pct: 85 },
                  { feature: 'RAG Chatbot', calls: 38100, pct: 72 },
                  { feature: 'Report Analyzer (OCR+NLP)', calls: 28400, pct: 54 },
                  { feature: 'Cost Predictor (XGBoost)', calls: 22800, pct: 43 },
                  { feature: 'Doctor Recommender', calls: 18600, pct: 35 },
                ].map((item) => (
                  <div key={item.feature} className="flex items-center gap-4">
                    <div className="w-48 text-slate-400 text-sm truncate">{item.feature}</div>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="bg-sky-500 h-2 rounded-full"
                      />
                    </div>
                    <div className="text-slate-400 text-xs w-16 text-right">{item.calls.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPage;
