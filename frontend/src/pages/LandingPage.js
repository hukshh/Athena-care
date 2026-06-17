import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Brain, Shield, Globe, Star, ArrowRight, CheckCircle,
  Activity, Heart, Stethoscope, TrendingUp, Users, Award,
  MessageSquare, FileText, MapPin, ChevronRight, Play,
  Zap, Lock, Clock, BarChart3
} from 'lucide-react';

const stats = [
  { value: '50,000+', label: 'Patients Served', icon: Users },
  { value: '2,400+', label: 'Partner Hospitals', icon: Heart },
  { value: '89', label: 'Countries Covered', icon: Globe },
  { value: '98.2%', label: 'Match Accuracy', icon: Brain },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Our ML engine analyzes 200+ parameters to find your perfect hospital match with 98% accuracy.',
    color: 'from-sky-500 to-blue-600',
    badge: 'Core AI',
  },
  {
    icon: FileText,
    title: 'Smart Report Analysis',
    description: 'Upload any medical document. Our OCR + NLP pipeline extracts insights in seconds.',
    color: 'from-violet-500 to-purple-600',
    badge: 'OCR + NLP',
  },
  {
    icon: MessageSquare,
    title: 'RAG Healthcare Chatbot',
    description: 'Ask anything about treatments, hospitals, or travel. Grounded AI answers, not hallucinations.',
    color: 'from-emerald-500 to-teal-600',
    badge: 'LangChain + FAISS',
  },
  {
    icon: BarChart3,
    title: 'Cost Intelligence',
    description: 'XGBoost models predict treatment costs across 89 countries with 94% accuracy.',
    color: 'from-amber-500 to-orange-600',
    badge: 'ML Prediction',
  },
  {
    icon: MapPin,
    title: 'Travel Planning',
    description: 'AI-generated visa checklists, accommodation guides, and recovery timelines.',
    color: 'from-rose-500 to-pink-600',
    badge: 'Smart Planning',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'End-to-end encryption, JWT auth, and role-based access control for your data.',
    color: 'from-slate-500 to-slate-600',
    badge: 'Enterprise Security',
  },
];

const hospitals = [
  { name: 'Bumrungrad International', country: 'Thailand', rating: 4.9, specialty: 'Oncology', patients: '1.1M+' },
  { name: 'Apollo Hospitals', country: 'India', rating: 4.8, specialty: 'Cardiology', patients: '2.3M+' },
  { name: 'Anadolu Medical Center', country: 'Turkey', rating: 4.9, specialty: 'Neurology', patients: '800K+' },
  { name: 'Gleneagles Hospital', country: 'Singapore', rating: 4.8, specialty: 'Orthopedics', patients: '950K+' },
  { name: 'Medicana Health Group', country: 'Turkey', rating: 4.7, specialty: 'Transplant', patients: '600K+' },
  { name: 'Fortis Healthcare', country: 'India', rating: 4.8, specialty: 'Spine Surgery', patients: '1.5M+' },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    country: 'United States',
    avatar: 'SM',
    treatment: 'Cardiac Surgery',
    hospital: 'Apollo Hospitals, India',
    quote: 'AthenaCare matched me with the perfect cardiac surgeon in India. Saved $180,000 compared to US prices. The AI recommendations were spot-on.',
    rating: 5,
    savings: '$180,000',
  },
  {
    name: 'James Okonkwo',
    country: 'Nigeria',
    avatar: 'JO',
    treatment: 'Knee Replacement',
    hospital: 'Bumrungrad, Thailand',
    quote: 'The travel planner handled everything — visa, accommodation, post-op care. I felt supported throughout my entire medical journey.',
    rating: 5,
    savings: '$45,000',
  },
  {
    name: 'Elena Vasquez',
    country: 'Spain',
    avatar: 'EV',
    treatment: 'Cancer Treatment',
    hospital: 'Anadolu Medical, Turkey',
    quote: 'The AI chatbot answered every question I had at 3am. The hospital match score was 97% — and the treatment outcome proved it right.',
    rating: 5,
    savings: '$95,000',
  },
];

const HeroSection = () => {
  const [currentWord, setCurrentWord] = useState(0);
  const words = ['Smarter', 'Faster', 'Safer', 'Affordable'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-8"
        >
          <Zap className="w-4 h-4 text-sky-400" />
          <span className="text-sky-400 text-sm font-medium">AI-Powered Medical Tourism Platform</span>
          <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Find the{' '}
          <span className="relative">
            <motion.span
              key={currentWord}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="gradient-text"
            >
              {words[currentWord]}
            </motion.span>
          </span>
          {' '}Hospital
          <br />
          <span className="text-slate-300">for Your Treatment</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          AthenaCare AI analyzes your medical reports, diagnosis, and budget to match you with 
          the world's best hospitals and doctors — across 89 countries, in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to="/signup" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            Get AI Recommendations
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
            <Play className="w-5 h-5" />
            Watch Demo
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-slate-500"
        >
          {['HIPAA Compliant', 'ISO 27001 Certified', 'JCI Accredited Partners', 'No Hidden Fees'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div className="glass-card p-1 max-w-4xl mx-auto shadow-2xl shadow-sky-500/10">
            <div className="bg-slate-900 rounded-xl p-6">
              {/* Mock Dashboard Preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="flex-1 bg-slate-800 rounded-full h-6 ml-4" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Match Score', value: '97%', color: 'text-emerald-400' },
                  { label: 'Hospitals Found', value: '24', color: 'text-sky-400' },
                  { label: 'Cost Savings', value: '$85K', color: 'text-violet-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-slate-500 text-xs mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {hospitals.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-800/30 rounded-xl p-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {h.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{h.name}</div>
                      <div className="text-slate-500 text-xs">{h.country} · {h.specialty}</div>
                    </div>
                    <div className="text-emerald-400 text-sm font-semibold">
                      {95 - i * 2}% match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const StatsSection = () => (
  <section className="py-20 border-y border-slate-800/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="py-32 relative">
    <div className="absolute inset-0 bg-dots opacity-20" />
    <div className="relative max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="badge-blue mb-4 mx-auto w-fit">Platform Features</div>
        <h2 className="section-title">Everything You Need for<br />Medical Tourism</h2>
        <p className="section-subtitle mx-auto text-center">
          From AI-powered hospital matching to travel planning — AthenaCare handles your entire medical journey.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="card-hover group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <div className="badge-blue mb-3 w-fit text-xs">{feature.badge}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const HospitalsSection = () => (
  <section className="py-32 bg-slate-900/30">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="badge-green mb-4 mx-auto w-fit">Trusted Partners</div>
        <h2 className="section-title">World-Class Hospital Network</h2>
        <p className="section-subtitle mx-auto text-center">
          Partnered with JCI-accredited hospitals across Asia, Europe, and the Middle East.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital, i) => (
          <motion.div
            key={hospital.name}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="glass-card p-6 hover:border-sky-500/30 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {hospital.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-white font-semibold text-sm">{hospital.rating}</span>
              </div>
            </div>
            <h3 className="text-white font-semibold mb-1">{hospital.name}</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
              <MapPin className="w-3 h-3" />
              {hospital.country}
            </div>
            <div className="flex items-center justify-between">
              <span className="badge-blue">{hospital.specialty}</span>
              <span className="text-slate-500 text-xs">{hospital.patients} patients</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-32">
    <div className="max-w-7xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="badge-purple mb-4 mx-auto w-fit">Patient Stories</div>
        <h2 className="section-title">Real Patients, Real Results</h2>
        <p className="section-subtitle mx-auto text-center">
          Thousands of patients have found their perfect treatment abroad with AthenaCare AI.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            viewport={{ once: true }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-1 mb-4">
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {t.avatar}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-slate-500 text-xs">{t.country}</div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-xs">Treatment</div>
                <div className="text-slate-300 text-xs font-medium">{t.treatment}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-xs">Saved</div>
                <div className="text-emerald-400 text-sm font-bold">{t.savings}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-violet-500/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
    </div>
    <div className="relative max-w-4xl mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Start Your Medical Journey
          <br />
          <span className="gradient-text">with AI Confidence</span>
        </h2>
        <p className="text-slate-400 text-xl mb-10">
          Join 50,000+ patients who found world-class treatment abroad. 
          Upload your report and get AI recommendations in 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="btn-primary flex items-center gap-2 text-lg px-10 py-4">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-10 py-4">
            Sign In
          </Link>
        </div>
        <p className="text-slate-600 text-sm mt-6">No credit card required · Free AI analysis · Cancel anytime</p>
      </motion.div>
    </div>
  </section>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">AthenaCare <span className="gradient-text">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="nav-link">Features</a>
          <a href="#hospitals" className="nav-link">Hospitals</a>
          <a href="#testimonials" className="nav-link">Stories</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Sign In</Link>
          <Link to="/signup" className="btn-primary py-2 px-5 text-sm">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="border-t border-slate-800/50 py-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">AthenaCare AI</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            AI-powered medical tourism platform connecting patients with world-class healthcare globally.
          </p>
        </div>
        {[
          { title: 'Platform', links: ['Hospital Matching', 'Doctor Search', 'Cost Predictor', 'Travel Planner'] },
          { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Contact'] },
          { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Cookie Policy'] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-white font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-slate-600 text-sm">© 2024 AthenaCare AI. All rights reserved.</p>
        <div className="flex items-center gap-4 text-slate-600 text-sm">
          <span>🔒 HIPAA Compliant</span>
          <span>🏥 JCI Accredited Partners</span>
          <span>🌍 89 Countries</span>
        </div>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <div id="features"><FeaturesSection /></div>
      <div id="hospitals"><HospitalsSection /></div>
      <div id="testimonials"><TestimonialsSection /></div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
