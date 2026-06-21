import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  MapPin,
  Phone,
  Building2,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { complaintCategories } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { supabase, type ComplaintInsert } from '@/lib/supabase';

interface AIAnalysis {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  estimatedResolution: string;
  summary: string;
}

export function FileComplaintPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [formData, setFormData] = useState({
    citizenName: '',
    email: '',
    title: '',
    description: '',
    category: '',
    location: '',
    contactNumber: '',
    date: new Date().toISOString().split('T')[0],
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  const analyzeComplaint = async (): Promise<AIAnalysis | null> => {
    setIsAnalyzing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          category: formData.category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze complaint');
      }

      const analysis = await response.json();
      setAiAnalysis(analysis);
      setShowAnalysis(true);
      return analysis;
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback to basic analysis
      const fallback: AIAnalysis = {
        category: formData.category || 'Other',
        priority: 'medium',
        department: 'General Administration',
        estimatedResolution: '7-14 days',
        summary: formData.description.slice(0, 150) + (formData.description.length > 150 ? '...' : ''),
      };
      setAiAnalysis(fallback);
      setShowAnalysis(true);
      return fallback;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Analyze the complaint with Gemini
      const analysis = await analyzeComplaint();
      if (!analysis) {
        throw new Error('Failed to analyze complaint');
      }

      // Step 2: Insert complaint into Supabase
      const complaintData: ComplaintInsert = {
        citizen_name: formData.citizenName,
        email: formData.email,
        description: formData.description,
        category: analysis.category,
        department: analysis.department,
        priority: analysis.priority,
        status: 'pending',
        ai_summary: analysis.summary,
        location: formData.location,
        contact_number: formData.contactNumber,
      };

      const { data, error: insertError } = await supabase
        .from('complaints')
        .insert(complaintData)
        .select('complaint_id')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to submit complaint. Please try again.');
      }

      // Step 3: Show success with complaint ID
      setComplaintId(data.complaint_id);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && complaintId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Submitted Successfully!</h2>
            <p className="text-slate-600 mb-6">
              Your complaint has been registered and is now being processed.
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-slate-500 mb-2">Your Complaint ID</p>
              <p className="text-2xl font-mono font-bold text-blue-600">{complaintId}</p>
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Summary
                </p>
                <p className="text-sm text-slate-700">{aiAnalysis.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', priorityColors[aiAnalysis.priority])}>
                    {aiAnalysis.priority.charAt(0).toUpperCase() + aiAnalysis.priority.slice(1)} Priority
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {aiAnalysis.department}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-500 mb-6">
              Please save your complaint ID for future reference. You can use it to track the status of your complaint.
            </p>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  setShowAnalysis(false);
                  setComplaintId(null);
                  setFormData({
                    citizenName: '',
                    email: '',
                    title: '',
                    description: '',
                    category: '',
                    location: '',
                    contactNumber: '',
                    date: new Date().toISOString().split('T')[0],
                  });
                }}
                className="flex-1"
              >
                File Another Complaint
              </Button>
              <Button
                onClick={() => navigate('/track')}
                className="flex-1"
              >
                Track This Complaint
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">File a Complaint</h1>
        <p className="text-slate-600">Submit your grievance and let AI handle the rest</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Complaint Details
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Citizen Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.citizenName}
                  onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter a brief title for your complaint"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[150px]"
                  placeholder="Describe your complaint in detail. Include relevant dates, times, and specific issues..."
                  required
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    required
                  >
                    <option value="">Select category</option>
                    {complaintCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter the location of the issue"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload Image (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Drag & drop an image here, or <span className="text-blue-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.citizenName || !formData.email || !formData.title || !formData.description || !formData.location}
                  className="flex-1 h-12"
                >
                  {isSubmitting ? (
                    <>
                      {isAnalyzing ? (
                        <>
                          <Sparkles className="w-5 h-5 animate-pulse mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Submitting...
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Analysis Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                AI Analysis
              </h2>
            </div>

            {!showAnalysis ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  Submit your complaint to get AI-powered analysis including categorization, priority assessment, and estimated resolution time.
                </p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Auto-categorization</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Priority assessment</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Department routing</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Resolution estimation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4 animate-fade-in">
                {/* Category */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Category</p>
                  <p className="font-semibold text-slate-900">{aiAnalysis?.category}</p>
                </div>

                {/* Priority */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Priority Level</p>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', priorityColors[aiAnalysis?.priority || 'medium'])}>
                    {aiAnalysis?.priority.charAt(0).toUpperCase()}{aiAnalysis?.priority.slice(1)}
                  </span>
                </div>

                {/* Department */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Assigned Department</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{aiAnalysis?.department}</span>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Est. Resolution Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{aiAnalysis?.estimatedResolution}</span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Summary
                  </p>
                  <p className="text-sm text-slate-700">{aiAnalysis?.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
