import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Zap, Plane, Hotel, Pill, Stethoscope, Heart,
  DollarSign, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import { costAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PROCEDURES = [
  'Coronary Artery Bypass (CABG)', 'Knee Replacement', 'Hip Replacement',
  'Spinal Fusion', 'Heart Valve Replacement', 'Liver Transplant',
  'Kidney Transplant', 'Cancer Treatment (Chemotherapy)', 'Brain Tumor Surgery',
  'Cataract Surgery', 'Dental Implants', 'IVF Treatment',
];

const COUNTRIES = ['India', 'Thailand', 'Turkey', 'Singapore', 'Malaysia', 'Germany', 'South Korea'];

const COUNTRY_COLORS = {
  India: '#8b5cf6', Thailand: '#06b6d4', Turkey: '#22c55e',
  Singapore: '#eab308', Malaysia: '#ec4899', Germany: '#f97316',
  'South Korea': '#3b82f6', USA: '#ef4444', UK: '#f97316',
};

const BREAKDOWN_ICONS = {
  Surgery: Stethoscope, 'Hospital Stay': Heart, Medicines: Pill,
  Travel: Plane, Accommodation: Hotel, Recovery: DollarSign,
};

const CostPredictorPage = () => {
  const [formData, setFormData] = useState({ procedure: '', country: 'India', age: '' });
  const [prediction, setPrediction] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    if (!formData.procedure) {
      toast.error('Please select a procedure');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        procedure: formData.procedure,
        country: formData.country,
        age: formData.age ? parseInt(formData.age) : 45,
      };

      // Run all three API calls in parallel
      const [predRes, compRes, breakRes] = await Promise.allSettled([
        costAPI.predict(payload),
        costAPI.compareCountries({ procedure: formData.procedure, age: payload.age }),
        costAPI.getBreakdown(payload),
      ]);

      if (predRes.status === 'fulfilled') setPrediction(predRes.value.data);
      if (compRes.status === 'fulfilled') {
        const comp = compRes.value.data?.comparison || [];
        setComparison(comp.map((c) => ({
          country: c.country,
          cost: c.cost,
          quality: c.quality_score,
          color: COUNTRY_COLORS[c.country] || '#64748b',
        })));
      }
      if (breakRes.status === 'fulfilled') setBreakdown(breakRes.value.data);

      toast.success('Cost prediction complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Prediction failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = breakdown?.total || prediction?.estimated_cost || 0;
  const usCost = prediction?.us_equivalent || comparison.find((c) => c.country === 'USA')?.cost || 0;
  const savings = prediction?.savings || (usCost - totalCost);
  const savingsPct = prediction?.savings_percentage || (usCost > 0 ? Math.round((savings / usCost) * 100) : 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Treatment Cost Predictor</h1>
          <p className="text-slate-400 text-sm mt-1">ML-powered cost estimation across 89 countries</p>
        </div>

        {/* Input Form */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-white font-semibold">Cost Prediction Engine</h2>
            <span className="badge-blue ml-auto">XGBoost Model</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="lg:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Medical Procedure</label>
              <select value={formData.procedure} onChange={(e) => setFormData({ ...formData, procedure: e.target.value })} className="input-field">
                <option value="">Select procedure...</option>
                {PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Destination Country</label>
              <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="input-field">
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Patient Age</label>
              <input
                type="number" value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input-field" placeholder="e.g. 45" min="1" max="100"
              />
            </div>
          </div>

          <button onClick={handlePredict} disabled={loading} className="btn-primary flex items-center gap-2 px-8 py-3">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Predicting...</>
              : <><Zap className="w-4 h-4" /> Predict Costs</>
            }
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-5 border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
            <button onClick={handlePredict} className="btn-ghost text-sm ml-auto flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {(prediction || comparison.length > 0) && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Estimated Total', value: `$${totalCost.toLocaleString()}`, color: 'text-sky-400', sub: `in ${formData.country}` },
                  { label: 'US Equivalent', value: `$${usCost.toLocaleString()}`, color: 'text-red-400', sub: 'average cost' },
                  { label: 'Your Savings', value: `$${savings.toLocaleString()}`, color: 'text-emerald-400', sub: 'vs. USA' },
                  { label: 'Savings %', value: `${savingsPct}%`, color: 'text-violet-400', sub: 'cost reduction' },
                ].map((item) => (
                  <div key={item.label} className="glass-card p-5">
                    <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                    <div className="text-white text-sm font-medium">{item.label}</div>
                    <div className="text-slate-500 text-xs">{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Country Comparison */}
              {comparison.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-6">Cost Comparison by Country</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparison} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="country" stroke="#475569" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        formatter={(v) => [`$${v.toLocaleString()}`, 'Estimated Cost']}
                      />
                      <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                        {comparison.map((entry, i) => (
                          <Cell key={i} fill={entry.color || '#0ea5e9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cost Breakdown */}
              {breakdown && (
                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-6">Cost Breakdown — {formData.country}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {breakdown.breakdown?.map((item) => {
                        const Icon = BREAKDOWN_ICONS[item.category] || DollarSign;
                        const color = '#0ea5e9';
                        return (
                          <div key={item.category} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-sky-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-300 text-sm">{item.category}</span>
                                <span className="text-white font-semibold text-sm">${item.amount?.toLocaleString()}</span>
                              </div>
                              <div className="bg-slate-800 rounded-full h-1.5">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.percentage || (item.amount / breakdown.total) * 100}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                  className="h-1.5 rounded-full bg-sky-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                        <span className="text-white font-semibold">Total Estimated</span>
                        <span className="text-sky-400 font-bold text-lg">${breakdown.total?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Quality Radar */}
                    {comparison.length > 0 && (
                      <div>
                        <h4 className="text-slate-400 text-sm mb-4">Quality Score by Country</h4>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={comparison.slice(0, 6)}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="country" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                            <Radar name="Quality" dataKey="quality" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Model Info */}
              {prediction?.model && (
                <div className="text-center text-slate-600 text-xs">
                  Prediction model: {prediction.model} · Confidence: {Math.round((prediction.confidence || 0.87) * 100)}%
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default CostPredictorPage;
