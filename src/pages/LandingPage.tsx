import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Bot,
  ArrowRight,
  FileText,
  Search,
  MessageSquare,
  BarChart3,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Users,
  Lock,
  Loader2,
  Upload,
  MapPin,
  Phone,
  AlertTriangle,
  Building2,
  TrendingUp,
  Globe,
  Languages,
  Accessibility,
  Award,
  Activity,
  Flame,
  Droplets,
  Zap,
  Construction,
  Bell,
  CheckCircle,
  Circle,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SchemeRecommendation {
  title: string;
  category: string;
  benefits: string;
  reason: string;
  matchScore: number;
}

/* ---------- Data ---------- */

const trustMetrics = [
  { value: '10,000+', label: 'Complaints Resolved', icon: CheckCircle2 },
  { value: '95%', label: 'Routing Accuracy', icon: TrendingUp },
  { value: '24/7', label: 'AI Support', icon: Clock },
  { value: '15+', label: 'Departments Connected', icon: Building2 },
];

const services = [
  { icon: FileText, title: 'Complaint Registration', description: 'File grievances with AI-powered categorization and instant department routing.', href: '/file-complaint' },
  { icon: Sparkles, title: 'Government Schemes Discovery', description: 'Find schemes you qualify for with personalized AI recommendations.', href: '/schemes' },
  { icon: FileText, title: 'Document Assistance', description: 'Get step-by-step guidance and checklists for every government document.', href: '/assistant' },
  { icon: Search, title: 'Application Tracking', description: 'Monitor real-time status across every stage from submission to resolution.', href: '/track' },
  { icon: AlertTriangle, title: 'Emergency Reporting', description: 'Report hazards instantly with location and photo evidence.', href: '/file-complaint?emergency=true' },
  { icon: MessageSquare, title: 'AI Citizen Assistant', description: 'A 24/7 chatbot guiding citizens through services, schemes, and documentation.', href: '/assistant' },
];

const samplePrompts = [
  'How do I apply for an income certificate?',
  'Government schemes for students',
  'Track my complaint',
  'Documents required for passport',
  'Scholarship opportunities',
];

const mockReplies: Record<string, string> = {
  'How do I apply for an income certificate?':
    'To apply for an income certificate: visit your state e-District portal, fill the application, attach Aadhaar + address proof + salary slips, and submit. Fee: Rs. 20-50. Processing: 7-15 days. Download digitally once approved.',
  'Government schemes for students':
    'Eligible student schemes: National Scholarship Portal (up to Rs. 50,000/yr), PM Research Fellowship, Vidyalakshmi Portal education loans, AICTE Pragati/Saksham. The Schemes engine on this page can match your profile precisely.',
  'Track my complaint':
    'Please share your complaint ID (e.g. CVC2024001). Once entered in Track Complaint, you\'ll see a live timeline: Submitted → Routed → Officer Assigned → Investigating → Resolved.',
  'Documents required for passport':
    'For a fresh passport: Aadhaar, PAN, birth certificate, address proof (utility bill/voter ID), and 2 photos. Apply at passportindia.gov.in. Police verification follows. Typical turnaround: 30-45 days.',
  'Scholarship opportunities':
    'Top scholarships: NPSC, Inspire-SHE (Rs. 80,000/yr), Kishore Vaigyanik (KVPY), AICTE Pragati for girls, CBSE merit-cum-means. Use the Scheme Recommendation Engine below for matches based on age, income, and occupation.',
};

interface ChatMessage { id: number; role: 'user' | 'bot'; text: string; }

const smartFilingSteps = [
  { icon: Upload, title: 'Upload Image/Video', desc: 'Citizen uploads a photo of the issue.' },
  { icon: Sparkles, title: 'AI Detects Issue', desc: 'Vision model identifies: Streetlight malfunction.' },
  { icon: Building2, title: 'AI Suggests Department', desc: 'Auto-routed to Municipal Corporation.' },
  { icon: FileText, title: 'AI Generates Draft', desc: 'Complaint draft auto-filled from detection.' },
  { icon: AlertTriangle, title: 'AI Assigns Priority', desc: 'Priority set to Medium — public safety impact.' },
];

const trackingTimeline = [
  { status: 'Complaint Submitted', done: true, icon: CheckCircle },
  { status: 'Routed to Department', done: true, icon: CheckCircle },
  { status: 'Officer Assigned', done: true, icon: CheckCircle },
  { status: 'Under Investigation', done: false, active: true, icon: Clock },
  { status: 'Resolved', done: false, icon: Circle },
];

const securityBadges = [
  { icon: Lock, label: 'Secure', desc: 'End-to-end encrypted' },
  { icon: Languages, label: 'Multilingual', desc: '12 Indian languages' },
  { icon: Accessibility, label: 'Accessible', desc: 'WCAG 2.1 AA compliant' },
  { icon: Globe, label: 'Transparent', desc: 'Open data initiative' },
  { icon: Bot, label: 'AI Powered', desc: 'Gemini-driven routing' },
  { icon: Shield, label: 'Government Ready', desc: 'MeITy compliant' },
];

const howItWorks = [
  { step: '01', title: 'Ask or Report', desc: 'Citizen submits a query or complaint in plain language.', icon: MessageSquare },
  { step: '02', title: 'AI Understands', desc: 'Gemini parses intent, category, and priority.', icon: Bot },
  { step: '03', title: 'Department Routing', desc: 'Auto-assigned to the correct government department.', icon: Building2 },
  { step: '04', title: 'Track Progress', desc: 'Live status updates at every stage of resolution.', icon: Search },
  { step: '05', title: 'Resolution', desc: 'Issue resolved, citizen notified, feedback captured.', icon: CheckCircle2 },
];

const monthlyData = [
  { month: 'Jan', resolved: 320, filed: 410 },
  { month: 'Feb', resolved: 410, filed: 440 },
  { month: 'Mar', resolved: 520, filed: 560 },
  { month: 'Apr', resolved: 610, filed: 640 },
  { month: 'May', resolved: 720, filed: 760 },
  { month: 'Jun', resolved: 850, filed: 880 },
];

const deptEfficiency = [
  { name: 'Municipal', value: 92, fill: '#2563eb' },
  { name: 'Water', value: 87, fill: '#0891b2' },
  { name: 'Electricity', value: 84, fill: '#0ea5e9' },
  { name: 'Health', value: 79, fill: '#10b981' },
  { name: 'Transport', value: 73, fill: '#6366f1' },
];

const commonIssues = [
  { issue: 'Streetlight Fault', count: 1240, dept: 'Municipal' },
  { issue: 'Water Leakage', count: 980, dept: 'Water Board' },
  { issue: 'Potholes', count: 870, dept: 'Roads & Transport' },
  { issue: 'Garbage Collection', count: 760, dept: 'Sanitation' },
  { issue: 'Illegal Parking', count: 540, dept: 'Traffic' },
];

const heatData = [
  { area: 'Sector 1', level: 'High', intensity: 85 },
  { area: 'Sector 2', level: 'Medium', intensity: 55 },
  { area: 'Sector 3', level: 'High', intensity: 90 },
  { area: 'Sector 4', level: 'Low', intensity: 25 },
  { area: 'Sector 5', level: 'Medium', intensity: 60 },
  { area: 'Sector 6', level: 'High', intensity: 78 },
  { area: 'Sector 7', level: 'Low', intensity: 18 },
  { area: 'Sector 8', level: 'Medium', intensity: 48 },
];

const emergencyCategories = [
  { icon: Flame, label: 'Fire Hazard', color: 'text-red-600 bg-red-50' },
  { icon: Construction, label: 'Road Damage', color: 'text-amber-600 bg-amber-50' },
  { icon: Droplets, label: 'Water Leakage', color: 'text-blue-600 bg-blue-50' },
  { icon: Zap, label: 'Fallen Electric Pole', color: 'text-yellow-600 bg-yellow-50' },
];

const dashboardCards = [
  { label: 'Active Complaints', value: '3', icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
  { label: 'Resolved Complaints', value: '12', icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
  { label: 'Pending Applications', value: '2', icon: Clock, color: 'from-blue-500 to-sky-500' },
  { label: 'Eligible Schemes', value: '5', icon: Sparkles, color: 'from-cyan-500 to-blue-500' },
  { label: 'Notifications', value: '7', icon: Bell, color: 'from-indigo-500 to-blue-500' },
];

/* ---------- Component ---------- */

export function LandingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'bot', text: 'Namaste! I\'m JanSeva Assistant. I can help you file complaints, discover schemes, track applications, and answer service questions. Try a prompt below.' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scheme recommendation form
  const [schemeForm, setSchemeForm] = useState({
    age: '',
    income: '',
    occupation: '',
    state: '',
    gender: '',
    category: '',
    education: '',
    disability: '',
  });
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [schemeError, setSchemeError] = useState<string | null>(null);
  const [schemeRecommendations, setSchemeRecommendations] = useState<SchemeRecommendation[]>([]);
  const [schemeSubmitted, setSchemeSubmitted] = useState(false);

  // Emergency form
  const [emergencyType, setEmergencyType] = useState('Fire Hazard');
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencySubmitted, setEmergencySubmitted] = useState(false);

  const handleEmergencySubmit = () => {
    if (!emergencyLocation.trim() || !emergencyContact.trim()) return;
    setEmergencySubmitted(true);
    setTimeout(() => setEmergencySubmitted(false), 4000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendPrompt = (prompt: string) => {
    if (!prompt.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply = mockReplies[prompt] ?? 'I can help with filing complaints, tracking applications, discovering schemes, and document requirements. Could you provide more detail about what you need?';
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1100);
  };

  const recommendSchemes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schemeForm.age || !schemeForm.income || !schemeForm.occupation || !schemeForm.state) return;

    setSchemeLoading(true);
    setSchemeError(null);
    setSchemeRecommendations([]);
    setSchemeSubmitted(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scheme-recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify(schemeForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      const recommendations = data.recommendations || [];

      if (recommendations.length === 0) {
        setSchemeError('No schemes found matching your profile. Try adjusting your inputs.');
      } else {
        setSchemeRecommendations(recommendations);
      }
    } catch (err) {
      setSchemeError(
        err instanceof Error
          ? `Unable to generate recommendations: ${err.message}. Please try again.`
          : 'Unable to generate recommendations. Please try again.'
      );
    } finally {
      setSchemeLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-50" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Citizen Services Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                JanSeva –{' '}
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  AI-Powered Citizen Service Assistant
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                One platform for complaints, government schemes, document
                assistance, and citizen support — intelligently routing every
                request to the right department.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/assistant"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
                >
                  <Bot className="w-5 h-5" />
                  Start AI Assistant
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-900 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Explore Services
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Lock, label: 'Secure & Encrypted' },
                  { icon: Clock, label: '24/7 Available' },
                  { icon: Users, label: '50,000+ Citizens' },
                  { icon: CheckCircle2, label: 'Govt Verified' },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <badge.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gov-tech illustration card */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-600/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">JanSeva Portal</p>
                      <p className="text-xs text-slate-500">Government of India</p>
                    </div>
                  </div>
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: FileText, label: 'New Complaint', color: 'bg-blue-50 text-blue-600' },
                    { icon: Search, label: 'Track Status', color: 'bg-green-50 text-green-600' },
                    { icon: Sparkles, label: 'Find Schemes', color: 'bg-amber-50 text-amber-600' },
                    { icon: AlertTriangle, label: 'Emergency', color: 'bg-red-50 text-red-600' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.color)}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Live Status</span>
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 50, 80, 60, 95, 70, 85, 55, 90, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-600 to-sky-400 rounded-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Complaints resolved this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST METRICS ===== */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustMetrics.map((metric) => (
              <div key={metric.label} className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
                  <metric.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  {metric.value}
                </p>
                <p className="text-slate-600 mt-1 text-sm font-medium">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">One Platform, Every Service</h2>
            <p className="text-lg text-slate-600">Six core services that make engaging with government effortless.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.title}
                to={service.href}
                className="group bg-white rounded-2xl border border-slate-200 p-7 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors">
                  <service.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{service.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                  Open
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI ASSISTANT ===== */}
      <section id="assistant" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Bot className="w-4 h-4" />
                <span>AI Citizen Assistant</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Talk to JanSeva AI</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                A Gemini-powered assistant available 24/7 to answer questions
                about government services, schemes, documents, and complaint
                status — in plain language.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Natural language understanding in multiple Indian languages',
                  'Instant answers on schemes, documents, and procedures',
                  'Seamless handoff to complaint filing or tracking',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Open Full Assistant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Chat UI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-blue-600/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-sky-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-600/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">JanSeva Assistant</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Online • Ready to help
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>

              <div className="h-[340px] overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2.5 animate-fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-white">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {samplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendPrompt(prompt)}
                      disabled={isTyping}
                      className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors border border-blue-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendPrompt(input); }}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => sendPrompt(input)}
                    disabled={!input.trim() || isTyping}
                    aria-label="Send message"
                    className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SMART COMPLAINT FILING ===== */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Smart Complaint Filing</h2>
            <p className="text-lg text-slate-600">AI handles categorization, routing, drafting, and prioritization automatically.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Upload mock */}
              <div className="relative">
                <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="font-medium text-slate-700 mb-1">Upload Image or Video</p>
                  <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
                </div>
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">AI Detection Result</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    Issue: <strong>Streetlight malfunction</strong> detected with 94% confidence.
                    Auto-filled draft and routed to <strong>Municipal Department</strong> · <strong>Medium Priority</strong>.
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {smartFilingSteps.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-600/30 flex-shrink-0">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      {i < smartFilingSteps.length - 1 && <div className="w-0.5 h-8 bg-blue-200 mt-1" />}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-slate-900 text-sm">{step.title}</p>
                      <p className="text-sm text-slate-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPLAINT TRACKING TIMELINE ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Complaint Tracking Timeline</h2>
            <p className="text-lg text-slate-600">Real-time visibility from submission to resolution.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {trackingTimeline.map((item, i) => (
                <div key={item.status} className="flex items-start lg:items-center gap-4 flex-1">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                        item.done && 'bg-green-500 text-white',
                        item.active && 'bg-amber-400 text-white animate-pulse',
                        !item.done && !item.active && 'bg-slate-100 text-slate-400'
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="lg:max-w-[120px]">
                      <p className={cn('text-sm font-semibold', item.done || item.active ? 'text-slate-900' : 'text-slate-400')}>
                        {item.status}
                      </p>
                      {item.active && <p className="text-xs text-amber-600 font-medium">In Progress</p>}
                      {item.done && <p className="text-xs text-green-600 font-medium">Completed</p>}
                    </div>
                  </div>
                  {i < trackingTimeline.length - 1 && (
                    <div className={cn('hidden lg:block flex-1 h-0.5 rounded-full', item.done ? 'bg-green-400' : 'bg-slate-200')} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs text-slate-500 mb-1">Complaint ID</p>
                <p className="font-bold text-slate-900">CVC2024015</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs text-slate-500 mb-1">Department</p>
                <p className="font-bold text-slate-900">Municipal Corporation</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs text-slate-500 mb-1">Estimated Resolution</p>
                <p className="font-bold text-slate-900">3 days remaining</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SCHEME RECOMMENDATION ENGINE ===== */}
      <section id="scheme-engine" className="py-20 bg-slate-50/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Scheme Recommendation Engine</h2>
            <p className="text-lg text-slate-600">Enter your details and AI matches you with eligible government schemes.</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
              <form onSubmit={recommendSchemes} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={schemeForm.age}
                    onChange={(e) => setSchemeForm({ ...schemeForm, age: e.target.value })}
                    placeholder="e.g. 24"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Annual Income (₹)</label>
                  <input
                    type="text"
                    value={schemeForm.income}
                    onChange={(e) => setSchemeForm({ ...schemeForm, income: e.target.value })}
                    placeholder="e.g. 3,50,000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Occupation</label>
                  <select
                    value={schemeForm.occupation}
                    onChange={(e) => setSchemeForm({ ...schemeForm, occupation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select occupation</option>
                    <option value="student">Student</option>
                    <option value="farmer">Farmer</option>
                    <option value="employee">Salaried Employee</option>
                    <option value="business">Business Owner</option>
                    <option value="homemaker">Homemaker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <select
                    value={schemeForm.state}
                    onChange={(e) => setSchemeForm({ ...schemeForm, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select state</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="delhi">Delhi</option>
                    <option value="karnataka">Karnataka</option>
                    <option value="up">Uttar Pradesh</option>
                    <option value="mp">Madhya Pradesh</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <select
                      value={schemeForm.gender}
                      onChange={(e) => setSchemeForm({ ...schemeForm, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={schemeForm.category}
                      onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select</option>
                      <option value="general">General</option>
                      <option value="obc">OBC</option>
                      <option value="sc">SC</option>
                      <option value="st">ST</option>
                      <option value="ews">EWS</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
                  <select
                    value={schemeForm.education}
                    onChange={(e) => setSchemeForm({ ...schemeForm, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select education level</option>
                    <option value="below-10">Below 10th</option>
                    <option value="10th-pass">10th Pass</option>
                    <option value="12th-pass">12th Pass</option>
                    <option value="graduate">Graduate</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Disability Status (optional)</label>
                  <select
                    value={schemeForm.disability}
                    onChange={(e) => setSchemeForm({ ...schemeForm, disability: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">None</option>
                    <option value="yes">Person with disability</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Recommendations
                </button>
              </form>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-4">
              {schemeLoading ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">Analyzing your profile...</p>
                  <p className="text-sm text-slate-500">AI is matching you with eligible government schemes.</p>
                </div>
              ) : schemeError ? (
                <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">Could not generate recommendations</p>
                  <p className="text-sm text-slate-500 mb-4">{schemeError}</p>
                  <button
                    onClick={() => setSchemeError(null)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ) : !schemeSubmitted ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">Your recommendations will appear here</p>
                  <p className="text-sm text-slate-500">Fill the form and let AI find eligible schemes for you.</p>
                </div>
              ) : schemeRecommendations.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">No matching schemes found</p>
                  <p className="text-sm text-slate-500">Try adjusting your profile details for different recommendations.</p>
                </div>
              ) : (
                schemeRecommendations.map((scheme, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{scheme.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{scheme.category}</span>
                          {scheme.matchScore && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                              {scheme.matchScore}% match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{scheme.benefits}</p>
                        <p className="text-sm text-slate-500 italic">{scheme.reason}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CITIZEN DASHBOARD ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Citizen Dashboard</h2>
            <p className="text-lg text-slate-600">A unified view of your complaints, applications, and eligible schemes.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboardCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', card.color)}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            >
              View Full Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY REPORTING ===== */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Reporting</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Report a Hazard Instantly</h2>
            <p className="text-lg text-slate-600">Instant department routing with location and photo evidence.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select Emergency Category</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {emergencyCategories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setEmergencyType(cat.label)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                        emergencyType === cat.label
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', cat.color)}>
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter the location of the emergency"
                      value={emergencyLocation}
                      onChange={(e) => setEmergencyLocation(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Enter your contact number"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleEmergencySubmit}
                    disabled={!emergencyLocation.trim() || !emergencyContact.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    {emergencySubmitted ? 'Emergency Reported' : 'Submit Emergency Report'}
                  </button>
                  {emergencySubmitted && (
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Emergency reported. Authorities have been notified.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Upload Evidence</p>
                <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-8 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="font-medium text-slate-700 mb-1">Upload Image or Video</p>
                  <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Instant Routing</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    Your <strong>{emergencyType}</strong> report will be instantly routed to the
                    appropriate emergency response team with live tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRANSPARENCY & ANALYTICS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <BarChart3 className="w-4 h-4" />
              <span>Transparency & Analytics</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Governance Analytics Dashboard</h2>
            <p className="text-lg text-slate-600">Real-time insight into complaint performance across departments.</p>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <Clock className="w-6 h-6 text-blue-600 mb-3" />
              <p className="text-2xl font-bold text-slate-900">4.2 days</p>
              <p className="text-sm text-slate-500">Avg. Resolution Time</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <TrendingUp className="w-6 h-6 text-green-600 mb-3" />
              <p className="text-2xl font-bold text-slate-900">92%</p>
              <p className="text-sm text-slate-500">Resolution Rate</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <Users className="w-6 h-6 text-cyan-600 mb-3" />
              <p className="text-2xl font-bold text-slate-900">24,780</p>
              <p className="text-sm text-slate-500">Active Citizens</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <Award className="w-6 h-6 text-amber-600 mb-3" />
              <p className="text-2xl font-bold text-slate-900">4.5/5</p>
              <p className="text-sm text-slate-500">Citizen Rating</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Resolution Graph */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Monthly Resolution Trend</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <RTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="filed" stroke="#94a3b8" fillOpacity={0} name="Filed" />
                  <Area type="monotone" dataKey="resolved" stroke="#2563eb" fill="url(#resolvedGrad)" strokeWidth={2} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Department Efficiency */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Department Efficiency</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={deptEfficiency} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                    {deptEfficiency.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {deptEfficiency.map((d) => (
                  <div key={d.name} className="text-center">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: d.fill }} />
                    <p className="text-xs text-slate-600">{d.name}</p>
                    <p className="text-xs font-bold text-slate-900">{d.value}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Common Issues */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Most Common Issues</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={commonIssues} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="issue" stroke="#64748b" fontSize={11} width={110} />
                  <RTooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area-wise Heatmap (UI mockup) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Area-wise Issue Heatmap</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {heatData.map((cell) => (
                  <div
                    key={cell.area}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center text-white text-xs"
                    style={{ backgroundColor: `rgba(37, 99, 235, ${cell.intensity / 100})` }}
                  >
                    <span className="font-semibold">{cell.area.split(' ')[1]}</span>
                    <span className="opacity-80">{cell.level}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <span>Low</span>
                <div className="flex-1 h-2 mx-3 rounded-full bg-gradient-to-r from-blue-100 to-blue-600" />
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">From complaint to resolution in five simple steps.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" />
                )}
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
                  <div className="absolute inset-0 bg-blue-100 rounded-2xl" />
                  <div className="absolute text-4xl font-bold text-blue-200">{item.step}</div>
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 max-w-[180px] mx-auto leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST & SECURITY ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Trust & Security</h2>
            <p className="text-lg text-slate-600">Built to government standards with security and accessibility at the core.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {securityBadges.map((badge) => (
              <div key={badge.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center hover:shadow-md hover:border-blue-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <badge.icon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{badge.label}</p>
                <p className="text-xs text-slate-500">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-sky-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 text-white/90 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Experience Better Governance?</h2>
          <p className="text-lg text-blue-50 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens already benefiting from JanSeva's intelligent platform.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold shadow-lg hover:bg-blue-50 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
