import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, MapPin, Clock, ChevronRight, Brain,
  Heart, CheckCircle, Zap, AlertCircle, RefreshCw,
  Stethoscope, Info, AlertTriangle, TrendingUp
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { hospitalsAPI } from '../../services/api';
import { SkeletonHospitalCard, EmptyState } from '../../components/ui/SkeletonCard';
import { extractErrorMessage } from '../../utils/errorUtils';
import toast from 'react-hot-toast';

const COUNTRIES = ['All Countries', 'India', 'Thailand', 'Turkey', 'Singapore', 'Malaysia', 'Germany', 'South Korea'];
const BUDGETS = ['Any Budget', 'Under $10K', '$10K - $25K', '$25K - $50K', '$50K+'];
const URGENCIES = [
  { value: 'normal', label: 'Normal (1-3 months)' },
  { value: 'soon', label: 'Soon (2-4 weeks)' },
  { value: 'urgent', label: 'Urgent (1-2 weeks)' },
  { value: 'emergency', label: 'Emergency (Immediate)' },
];
const GRADIENTS = [
  'from-sky-500 to-blue-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600', 'from-indigo-500 to-blue-600',
];

// ── Diagnosis Analysis Banner ─────────────────────────────────────────────────
const DiagnosisBanner = ({ analysis }) => {
  if (!analysis?.detected_specialty) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Detected specialty */}
      <div className="flex items-center gap-3 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
        <Brain className="w-5 h-5 text-sky-400 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sky-400 font-medium text-sm">AI Detected Specialty: </span>
          <span className="text-white font-semibold text-sm">{analysis.detected_specialty}</span>
          <span className="text-slate-500 text-xs ml-2">
            ({Math.round(analysis.confidence * 100)}% confidence)
          </span>
        </div>
        {analysis.matched_keywords?.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-1">
            {analysis.matched_keywords.slice(0, 3).map((kw, i) => (
              <span key={i} className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Mismatch warning */}
      {analysis.is_specialty_mismatch && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-amber-400 font-medium text-sm">Specialty Mismatch Detected</div>
            <div className="text-amber-300/80 text-xs mt-0.5">{analysis.mismatch_message}</div>
          </div>
        </div>
      )}

      {/* Suggested procedures */}
      {analysis.suggested_procedures?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 text-xs">Related procedures:</span>
          {analysis.suggested_procedures.map((p, i) => (
            <span key={i} className="badge-blue text-xs">{p}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Match Score Ring ──────────────────────────────────────────────────────────
const MatchScoreRing = ({ score, gradient }) => {
  const color = score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-sky-400' : 'text-amber-400';
  return (
    <div className="flex-shrink-0 text-center">
      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">{score}%</span>
      </div>
      <div className={`text-xs mt-1 font-medium ${color}`}>
        {score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Fair'}
      </div>
    </div>
  );
};

// ── Hospital Card ─────────────────────────────────────────────────────────────
const HospitalCard = ({ hospital, index }) => {
  const [expanded, setExpanded] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const initials = hospital.name?.split(' ').map(w => w[0]).join('').slice(0, 3) || '?';

  const avgCost = hospital.avg_cost_usd
    ? `$${hospital.avg_cost_usd.min?.toLocaleString()} – $${hospital.avg_cost_usd.max?.toLocaleString()}`
    : hospital.avgCost || 'Contact for pricing';

  const duration = hospital.duration_days
    ? `${hospital.duration_days.min}–${hospital.duration_days.max} days`
    : hospital.duration || 'Varies';

  const matchReasons = hospital.match_reasons || [];
  const scoreBreakdown = hospital.score_breakdown || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="glass-card overflow-hidden hover:border-sky-500/20 transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">{hospital.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <MapPin className="w-3 h-3" />
                    {hospital.city}, {hospital.country}
                  </div>
                  {hospital.accreditation && (
                    <span className="badge-green text-xs">{hospital.accreditation}</span>
                  )}
                  {/* Specialty badge */}
                  {hospital.specialty && (
                    <span className="badge-blue text-xs flex items-center gap-1">
                      <Stethoscope className="w-2.5 h-2.5" />
                      {hospital.specialty}
                    </span>
                  )}
                </div>
              </div>
              <MatchScoreRing score={hospital.match_score} gradient={gradient} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-white font-semibold text-sm">{hospital.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="text-slate-500 text-xs">
                  {hospital.reviews_count ? `${hospital.reviews_count.toLocaleString()} reviews` : 'Rating'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-white font-semibold text-sm mb-1">
                  {hospital.success_rate ? `${hospital.success_rate}%` : 'N/A'}
                </div>
                <div className="text-slate-500 text-xs">Success Rate</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-emerald-400 font-semibold text-xs mb-1 truncate">{avgCost}</div>
                <div className="text-slate-500 text-xs">Est. Cost</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-sky-400 font-semibold text-sm mb-1">{duration}</div>
                <div className="text-slate-500 text-xs">Stay Duration</div>
              </div>
            </div>

            {/* Match reasons preview */}
            {matchReasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {matchReasons.slice(0, 2).map((reason, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/40 px-2 py-1 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {reason}
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {hospital.languages?.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-slate-500 text-xs">Languages:</span>
                {hospital.languages.slice(0, 4).map(lang => (
                  <span key={lang} className="text-slate-400 text-xs bg-slate-800/50 px-2 py-0.5 rounded-full">{lang}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-800/50 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-4">
                {/* Why this hospital */}
                {matchReasons.length > 0 && (
                  <div>
                    <h4 className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-sky-400" /> Why This Hospital?
                    </h4>
                    <div className="space-y-1.5">
                      {matchReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-400 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score breakdown */}
                {Object.keys(scoreBreakdown).length > 0 && (
                  <div>
                    <h4 className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> AI Score Breakdown
                    </h4>
                    <div className="space-y-1.5">
                      {[
                        { key: 'specialty', label: 'Specialty Match' },
                        { key: 'quality', label: 'Quality Score' },
                        { key: 'semantic', label: 'Diagnosis Relevance' },
                        { key: 'budget', label: 'Budget Fit' },
                      ].map(({ key, label }) => (
                        scoreBreakdown[key] !== undefined && (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs w-32">{label}</span>
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-sky-500"
                                style={{ width: `${Math.round(scoreBreakdown[key] * 100)}%` }}
                              />
                            </div>
                            <span className="text-slate-400 text-xs w-8 text-right">
                              {Math.round(scoreBreakdown[key] * 100)}%
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {hospital.specialties?.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-slate-300 text-sm font-medium mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {hospital.specialties.map(s => (
                        <span key={s} className="badge-blue text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setExpanded(!expanded)} className="btn-ghost text-sm flex items-center gap-1">
            {expanded ? 'Less Info' : 'Why This Match?'}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-1 ml-auto">
            <Heart className="w-4 h-4" /> Save
          </button>
          <button className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
            Contact <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const HospitalMatchingPage = () => {
  const [searchParams, setSearchParams] = useState({
    diagnosis: '', country: 'All Countries',
    budget: 'Any Budget', urgency: 'normal', age: '',
  });
  const [hospitals, setHospitals] = useState([]);
  const [diagnosisAnalysis, setDiagnosisAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const budgetMap = {
    'Any Budget': null, 'Under $10K': 10000,
    '$10K - $25K': 25000, '$25K - $50K': 50000, '$50K+': null,
  };

  const handleSearch = async () => {
    if (!searchParams.diagnosis.trim()) {
      toast.error('Please enter your diagnosis or condition');
      return;
    }
    setLoading(true);
    setError(null);
    setDiagnosisAnalysis(null);

    try {
      const payload = {
        diagnosis: searchParams.diagnosis.trim(),
        preferred_country: searchParams.country !== 'All Countries' ? searchParams.country : null,
        urgency: searchParams.urgency,
        age: searchParams.age ? parseInt(searchParams.age) : null,
        budget: budgetMap[searchParams.budget] ?? null,
      };

      const res = await hospitalsAPI.getRecommendations(payload);
      const data = res.data;

      setHospitals(data.recommendations || []);
      setDiagnosisAnalysis(data.diagnosis_analysis || null);
      setSearched(true);

      const count = data.recommendations?.length || 0;
      const specialty = data.diagnosis_analysis?.detected_specialty;

      if (count === 0) {
        toast('No hospitals found. Try broadening your search.', { icon: '🔍' });
      } else {
        toast.success(`Found ${count} ${specialty || ''} hospitals`);
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Search failed. Please try again.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Hospital Matching</h1>
          <p className="text-slate-400 text-sm mt-1">
            NLP-powered diagnosis understanding · Semantic hospital matching · Real AI scores
          </p>
        </div>

        {/* Search Panel */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-5 h-5 text-sky-400" />
            <h2 className="text-white font-semibold">AI-Powered Hospital Search</h2>
            <span className="badge-blue ml-auto">NLP + Semantic Matching</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">
                Diagnosis / Condition *
                <span className="text-slate-600 ml-1 text-xs">(AI will detect the correct specialty)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchParams.diagnosis}
                  onChange={e => setSearchParams({ ...searchParams, diagnosis: e.target.value })}
                  className="input-field pl-9"
                  placeholder="e.g. Coronary Artery Disease, Knee Replacement, Lung Cancer..."
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Preferred Country</label>
              <select value={searchParams.country} onChange={e => setSearchParams({ ...searchParams, country: e.target.value })} className="input-field">
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Budget Range</label>
              <select value={searchParams.budget} onChange={e => setSearchParams({ ...searchParams, budget: e.target.value })} className="input-field">
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Urgency Level</label>
              <select value={searchParams.urgency} onChange={e => setSearchParams({ ...searchParams, urgency: e.target.value })} className="input-field">
                {URGENCIES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Patient Age</label>
              <input
                type="number" value={searchParams.age}
                onChange={e => setSearchParams({ ...searchParams, age: e.target.value })}
                className="input-field" placeholder="e.g. 45" min="1" max="100"
              />
            </div>
          </div>

          <button onClick={handleSearch} disabled={loading} className="btn-primary flex items-center gap-2 px-8 py-3">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI Matching...</>
              : <><Zap className="w-4 h-4" /> Find Best Hospitals</>
            }
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonHospitalCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-card p-5 border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm flex-1">{error}</span>
            <button onClick={handleSearch} className="btn-ghost text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Results */}
        {searched && !loading && !error && (
          <div className="space-y-4">
            {/* Diagnosis analysis banner */}
            {diagnosisAnalysis && <DiagnosisBanner analysis={diagnosisAnalysis} />}

            {/* Results header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">{hospitals.length} Hospitals Found</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Ranked by AI match score for{' '}
                  <span className="text-sky-400">{diagnosisAnalysis?.detected_specialty || 'your condition'}</span>
                </p>
              </div>
              <span className="badge-green flex items-center gap-1">
                <Brain className="w-3 h-3" /> AI Ranked
              </span>
            </div>

            {hospitals.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No hospitals found"
                description="Try a different diagnosis or remove country/budget filters."
                action={
                  <button
                    onClick={() => setSearchParams({ ...searchParams, country: 'All Countries', budget: 'Any Budget' })}
                    className="btn-secondary py-2 px-4 text-sm"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {hospitals.map((hospital, i) => (
                  <HospitalCard key={hospital.id || hospital._id || i} hospital={hospital} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HospitalMatchingPage;
