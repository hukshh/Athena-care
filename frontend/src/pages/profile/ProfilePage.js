import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe, Calendar, Edit3, Save, Camera, Shield, Bell, Lock } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    blood_type: user?.blood_type || '',
    allergies: user?.allergies || '',
    chronic_conditions: user?.chronic_conditions || '',
  });

  const handleSave = async () => {
    try {
      updateUser(formData);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your personal and medical information</p>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={editing ? 'btn-primary flex items-center gap-2' : 'btn-secondary flex items-center gap-2'}
          >
            {editing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>

        {/* Profile Header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{user?.full_name || 'Patient'}</h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-green">Verified Patient</span>
                <span className="badge-blue">{user?.nationality || 'International'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" /> Personal Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'full_name', icon: User, type: 'text' },
              { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
              { label: 'Phone Number', key: 'phone', icon: Phone, type: 'tel' },
              { label: 'Nationality', key: 'nationality', icon: Globe, type: 'text' },
              { label: 'Date of Birth', key: 'date_of_birth', icon: Calendar, type: 'date' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-slate-400 mb-2">{field.label}</label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={field.type}
                    value={formData[field.key]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    disabled={!editing}
                    className={`input-field pl-9 ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={!editing}
                className={`input-field ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Medical Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Blood Type</label>
              <select
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                disabled={!editing}
                className={`input-field ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="">Select blood type</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Known Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                disabled={!editing}
                className={`input-field ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="e.g. Penicillin, Latex"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Chronic Conditions</label>
              <textarea
                value={formData.chronic_conditions}
                onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                disabled={!editing}
                className={`input-field resize-none ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                rows={3}
                placeholder="e.g. Hypertension, Type 2 Diabetes"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" /> Security & Privacy
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Change Password', desc: 'Update your account password', action: 'Update' },
              { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', action: 'Enable' },
              { label: 'Data Export', desc: 'Download all your medical data', action: 'Export' },
              { label: 'Delete Account', desc: 'Permanently delete your account', action: 'Delete', danger: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                <div>
                  <div className="text-white text-sm font-medium">{item.label}</div>
                  <div className="text-slate-500 text-xs">{item.desc}</div>
                </div>
                <button className={item.danger ? 'btn-ghost text-red-400 hover:text-red-300 text-sm' : 'btn-secondary py-2 px-4 text-sm'}>
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
