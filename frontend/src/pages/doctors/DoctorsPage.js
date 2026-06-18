import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Star, MapPin, Award, Clock, Globe, Filter,
  MessageSquare, Calendar, ChevronRight, Stethoscope, Brain
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import toast from 'react-hot-toast';

const mockDoctors = [
  {
    id: '1', name: 'Dr. Priya Sharma', specialty: 'Interventional Cardiologist',
    hospital: 'Apollo Hospitals', country: 'India', city: 'Chennai',
    rating: 4.9, reviews: 2840, experience: 22, matchScore: 96,
    languages: ['English', 'Hindi', 'Tamil'],
    education: 'AIIMS Delhi, Fellowship at Cleveland Clinic',
    procedures: ['CABG', 'PTCA', 'Valve Replacement', 'TAVR'],
    consultationFee: '$80', availability: 'Available in 3 days',
    avatar: 'PS', gradient: 'from-sky-500 to-blue-600',
    bio: 'Dr. Sharma is a leading interventional cardiologist with 22 years of experience. She has performed over 5,000 cardiac procedures with exceptional outcomes.',
  },
  {
    id: '2', name: 'Dr. Mehmet Yilmaz', specialty: 'Cardiac Surgeon',
    hospital: 'Anadolu Medical Center', country: 'Turkey', city: 'Istanbul',
    rating: 4.8, reviews: 1920, experience: 18, matchScore: 93,
    languages: ['English', 'Turkish', 'German'],
    education: 'Istanbul University, Fellowship at Johns Hopkins',
    procedures: ['Open Heart Surgery', 'Bypass Surgery', 'Heart Transplant'],
    consultationFee: '$120', availability: 'Available in 1 week',
    avatar: 'MY', gradient: 'from-emerald-500 to-teal-600',
    bio: 'Dr. Yilmaz specializes in complex cardiac surgeries and has trained at Johns Hopkins. Known for exceptional patient outcomes and personalized care.',
  },
  {
    id: '3', name: 'Dr. Somchai Pattanapong', specialty: 'Cardiologist',
    hospital: 'Bumrungrad International', country: 'Thailand', city: 'Bangkok',
    rating: 4.9, reviews: 3100, experience: 25, matchScore: 90,
    languages: ['English', 'Thai', 'Japanese'],
    education: 'Mahidol University, Fellowship at Mayo Clinic',
    procedures: ['Echocardiography', 'Cardiac Catheterization', 'Pacemaker Implant'],
    consultationFee: '$150', availability: 'Available tomorrow',
    avatar: 'SP', gradient: 'from-violet-500 to-purple-600',
    bio: 'Dr. Pattanapong is one of Thailand\'s most respected cardiologists with 25 years of experience and training from Mayo Clinic.',
  },
  {
    id: '4', name: 'Dr. Rajesh Kumar', specialty: 'Orthopedic Surgeon',
    hospital: 'Fortis Healthcare', country: 'India', city: 'New Delhi',
    rating: 4.7, reviews: 4200, experience: 20, matchScore: 87,
    languages: ['English', 'Hindi'],
    education: 'AIIMS Delhi, Fellowship at Hospital for Special Surgery NY',
    procedures: ['Knee Replacement', 'Hip Replacement', 'Spine Surgery', 'Sports Medicine'],
    consultationFee: '$60', availability: 'Available in 5 days',
    avatar: 'RK', gradient: 'from-amber-500 to-orange-600',
    bio: 'Dr. Kumar is a pioneer in minimally invasive joint replacement surgery with over 8,000 successful procedures.',
  },
];

const specialties = ['All Specialties', 'Cardiology', 'Orthopedics', 'Oncology', 'Neurology', 'Transplant'];
const countries = ['All Countries', 'India', 'Thailand', 'Turkey', 'Singapore'];
const languages = ['All Languages', 'English', 'Arabic', 'French', 'Spanish', 'German'];

const DoctorCard = ({ doctor, index }) => {
  const [showBio, setShowBio] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-6 hover:border-sky-500/20 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-16 h-16 bg-gradient-to-br ${doctor.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
          {doctor.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-semibold text-lg">{doctor.name}</h3>
              <p className="text-sky-400 text-sm">{doctor.specialty}</p>
              <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                <MapPin className="w-3 h-3" />
                {doctor.hospital}, {doctor.city}, {doctor.country}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${doctor.gradient} flex items-center justify-center`}>
                <span className="text-white font-bold text-xs">{doctor.matchScore}%</span>
              </div>
              <div className="text-slate-500 text-xs mt-1">Match</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-white font-semibold text-sm">{doctor.rating}</span>
              </div>
              <div className="text-slate-500 text-xs">{doctor.reviews.toLocaleString()} reviews</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-white font-semibold text-sm mb-1">{doctor.experience}+ yrs</div>
              <div className="text-slate-500 text-xs">Experience</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-emerald-400 font-semibold text-sm mb-1">{doctor.consultationFee}</div>
              <div className="text-slate-500 text-xs">Consultation</div>
            </div>
          </div>

          {/* Education & Languages */}
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <Award className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              {doctor.education}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="w-3 h-3 text-slate-500" />
              {doctor.languages.map((lang) => (
                <span key={lang} className="text-slate-400 text-xs bg-slate-800/50 px-2 py-0.5 rounded-full">{lang}</span>
              ))}
            </div>
          </div>

          {/* Procedures */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {doctor.procedures.map((p) => (
              <span key={p} className="badge-blue text-xs">{p}</span>
            ))}
          </div>

          {/* Bio */}
          {showBio && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-slate-400 text-sm leading-relaxed bg-slate-800/30 rounded-xl p-3"
            >
              {doctor.bio}
            </motion.p>
          )}

          {/* Availability & Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Clock className="w-3 h-3" />
              {doctor.availability}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBio(!showBio)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                {showBio ? 'Less' : 'Bio'}
              </button>
              <button className="btn-secondary py-2 px-3 text-xs flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Message
              </button>
              <button className="btn-primary py-2 px-3 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DoctorsPage = () => {
  const [filters, setFilters] = useState({
    search: '', specialty: 'All Specialties', country: 'All Countries', language: 'All Languages',
  });
  const [doctors] = useState(mockDoctors);

  const filtered = doctors.filter((d) => {
    if (filters.search && !d.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !d.specialty.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.specialty !== 'All Specialties' && !d.specialty.includes(filters.specialty)) return false;
    if (filters.country !== 'All Countries' && d.country !== filters.country) return false;
    if (filters.language !== 'All Languages' && !d.languages.includes(filters.language)) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Find Doctors</h1>
          <p className="text-slate-400 text-sm mt-1">AI-matched specialists based on your medical profile</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-5">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-9"
                placeholder="Search doctors..."
              />
            </div>
            <select
              value={filters.specialty}
              onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
              className="input-field"
            >
              {specialties.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="input-field"
            >
              {countries.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              className="input-field"
            >
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">{filtered.length} Doctors Found</h2>
            <span className="badge-blue flex items-center gap-1">
              <Brain className="w-3 h-3" /> AI Matched
            </span>
          </div>
          <div className="space-y-4">
            {filtered.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DoctorsPage;
