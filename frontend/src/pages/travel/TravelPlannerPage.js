import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plane, Hotel, FileText, Clock, CheckCircle,
  Calendar, Globe, AlertCircle, Download, Zap, ChevronRight
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import toast from 'react-hot-toast';

const mockPlan = {
  destination: 'India',
  hospital: 'Apollo Hospitals, Chennai',
  procedure: 'Cardiac Surgery',
  totalDays: 21,
  timeline: [
    { day: 'Day 1-2', phase: 'Arrival & Orientation', status: 'upcoming', tasks: ['Airport pickup', 'Hotel check-in', 'Hospital registration', 'Pre-admission tests'] },
    { day: 'Day 3-5', phase: 'Pre-Surgery Preparation', status: 'upcoming', tasks: ['Cardiology consultation', 'Anesthesia evaluation', 'Final blood work', 'Surgery briefing'] },
    { day: 'Day 6', phase: 'Surgery Day', status: 'upcoming', tasks: ['NPO from midnight', 'Pre-op preparation', 'Surgery (4-6 hours)', 'ICU admission'] },
    { day: 'Day 7-10', phase: 'ICU Recovery', status: 'upcoming', tasks: ['Intensive monitoring', 'Pain management', 'Breathing exercises', 'Daily physician rounds'] },
    { day: 'Day 11-15', phase: 'Ward Recovery', status: 'upcoming', tasks: ['Transfer to ward', 'Physiotherapy begins', 'Dietary guidance', 'Wound care'] },
    { day: 'Day 16-18', phase: 'Discharge Preparation', status: 'upcoming', tasks: ['Final evaluations', 'Medication briefing', 'Follow-up schedule', 'Discharge summary'] },
    { day: 'Day 19-21', phase: 'Pre-Departure', status: 'upcoming', tasks: ['Rest at hotel', 'Final check-up', 'Medical records collection', 'Return flight'] },
  ],
  visaChecklist: [
    { item: 'Valid passport (6+ months validity)', done: false },
    { item: 'Medical visa application (e-MedVisa)', done: false },
    { item: 'Hospital invitation letter', done: false },
    { item: 'Medical reports & diagnosis documents', done: false },
    { item: 'Travel insurance with medical coverage', done: false },
    { item: 'Proof of funds', done: false },
    { item: 'Return flight tickets', done: false },
    { item: 'Accommodation proof', done: false },
  ],
  accommodation: [
    { name: 'Apollo Guest House', type: 'Hospital-affiliated', distance: '0.2 km', price: '$45/night', rating: 4.5 },
    { name: 'Radisson Blu Chennai', type: '5-Star Hotel', distance: '1.5 km', price: '$120/night', rating: 4.8 },
    { name: 'OYO Rooms Medical District', type: 'Budget Hotel', distance: '0.8 km', price: '$25/night', rating: 4.1 },
  ],
};

const TravelPlannerPage = () => {
  const [formData, setFormData] = useState({
    destination: '', hospital: '', procedure: '', travelDate: '', companions: '1',
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visaChecklist, setVisaChecklist] = useState(mockPlan.visaChecklist);

  const handleGenerate = async () => {
    if (!formData.destination || !formData.procedure) {
      toast.error('Please fill in destination and procedure');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 2500));
      setPlan({ ...mockPlan, destination: formData.destination, procedure: formData.procedure });
      toast.success('Travel plan generated!');
    } catch {
      toast.error('Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisa = (index) => {
    setVisaChecklist((prev) => prev.map((item, i) => i === index ? { ...item, done: !item.done } : item));
  };

  const completedVisa = visaChecklist.filter((v) => v.done).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Medical Travel Planner</h1>
          <p className="text-slate-400 text-sm mt-1">AI-generated travel itinerary for your medical journey</p>
        </div>

        {/* Form */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Map className="w-5 h-5 text-sky-400" />
            <h2 className="text-white font-semibold">Generate Travel Plan</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Destination Country</label>
              <select
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="input-field"
              >
                <option value="">Select country...</option>
                {['India', 'Thailand', 'Turkey', 'Singapore', 'Malaysia'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Medical Procedure</label>
              <input
                type="text"
                value={formData.procedure}
                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                className="input-field"
                placeholder="e.g. Cardiac Surgery"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Planned Travel Date</label>
              <input
                type="date"
                value={formData.travelDate}
                onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-8 py-3"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate AI Travel Plan</>
            )}
          </button>
        </div>

        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Destination', value: plan.destination, icon: Globe, color: 'text-sky-400' },
                  { label: 'Total Duration', value: `${plan.totalDays} days`, icon: Clock, color: 'text-violet-400' },
                  { label: 'Hospital', value: plan.hospital.split(',')[0], icon: Map, color: 'text-emerald-400' },
                  { label: 'Procedure', value: plan.procedure, icon: FileText, color: 'text-amber-400' },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-4">
                    <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                    <div className="text-white font-semibold text-sm">{item.value}</div>
                    <div className="text-slate-500 text-xs">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Treatment Timeline</h3>
                  <button className="btn-secondary py-2 px-4 text-xs flex items-center gap-1">
                    <Download className="w-3 h-3" /> Export PDF
                  </button>
                </div>
                <div className="space-y-4">
                  {plan.timeline.map((phase, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i === 2 ? 'bg-sky-500' : 'bg-slate-800 border border-slate-700'
                        }`}>
                          {i === 2 ? (
                            <Zap className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        {i < plan.timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-800 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sky-400 text-xs font-medium">{phase.day}</span>
                          <h4 className="text-white font-medium text-sm">{phase.phase}</h4>
                          {i === 2 && <span className="badge-blue text-xs">Surgery</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {phase.tasks.map((task, j) => (
                            <div key={j} className="flex items-center gap-1.5 text-slate-400 text-xs">
                              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Visa Checklist */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Visa Checklist</h3>
                  <span className="text-slate-400 text-sm">{completedVisa}/{visaChecklist.length} completed</span>
                </div>
                <div className="mb-4 bg-slate-800 rounded-full h-2">
                  <motion.div
                    className="bg-sky-500 h-2 rounded-full"
                    animate={{ width: `${(completedVisa / visaChecklist.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {visaChecklist.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => toggleVisa(i)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        item.done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/30 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                      }`}>
                        {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${item.done ? 'text-emerald-400 line-through' : 'text-slate-300'}`}>
                        {item.item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accommodation */}
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-5">Recommended Accommodation</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {plan.accommodation.map((acc, i) => (
                    <div key={i} className="bg-slate-800/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium text-sm">{acc.name}</h4>
                          <span className="badge-blue text-xs mt-1">{acc.type}</span>
                        </div>
                        <div className="text-amber-400 text-xs font-medium">★ {acc.rating}</div>
                      </div>
                      <div className="text-slate-400 text-xs mt-2">📍 {acc.distance} from hospital</div>
                      <div className="text-emerald-400 font-semibold text-sm mt-2">{acc.price}</div>
                      <button className="btn-secondary w-full mt-3 py-2 text-xs">Book Now</button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default TravelPlannerPage;
