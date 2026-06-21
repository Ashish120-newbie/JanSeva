import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  Building2,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, type Complaint } from '@/lib/supabase';
import { subscribeToComplaintChanges } from '@/lib/complaintEvents';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusStages = [
  { id: 'submitted', label: 'Submitted', description: 'Complaint received' },
  { id: 'assigned', label: 'Assigned', description: 'Department assigned' },
  { id: 'in_progress', label: 'In Progress', description: 'Officer reviewing' },
  { id: 'resolved', label: 'Resolved', description: 'Issue resolved' },
];

function normalizeStatus(status: string): string {
  if (status === 'pending') return 'submitted';
  if (status === 'in_progress') return 'in_progress';
  return status;
}

function buildTimeline(complaint: Complaint) {
  const stages = [
    { id: 'submitted', label: 'Complaint submitted', ts: complaint.created_at },
    { id: 'assigned', label: 'Assigned to department', ts: complaint.officer_name ? complaint.updated_at : null },
    { id: 'in_progress', label: 'Officer review started', ts: complaint.officer_notes ? complaint.updated_at : null },
    { id: 'resolved', label: 'Complaint resolved', ts: complaint.resolved_at },
  ];
  return stages.map((s) => ({
    ...s,
    completed: s.ts !== null,
    ts: s.ts,
  }));
}

export function TrackComplaintPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [searchId, setSearchId] = useState(initialId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const searchComplaint = async (id: string) => {
    setLoading(true);
    setError(null);
    setComplaint(null);

    const trimmed = id.trim();
    if (!trimmed) {
      setError('Please enter a complaint ID.');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .or(`complaint_id.ilike.${trimmed},id.eq.${trimmed}`)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setLoading(false);
      return;
    }

    setComplaint(data as Complaint);
    setLoading(false);
  };

  useEffect(() => {
    if (initialId) {
      searchComplaint(initialId);
    }
    // Re-fetch when an officer updates a complaint, so the citizen sees
    // the new status without manually re-searching.
    const unsubscribe = subscribeToComplaintChanges(() => {
      if (complaint) {
        searchComplaint(complaint.complaint_id);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleSearch = () => {
    searchComplaint(searchId);
  };

  const getCurrentStageIndex = (status: string) => {
    const normalized = normalizeStatus(status);
    return statusStages.findIndex((s) => s.id === normalized);
  };

  const handleSubmitFeedback = () => {
    if (feedbackRating === 0) return;
    setFeedbackSubmitted(true);
  };

  const timeline = complaint ? buildTimeline(complaint) : [];
  const currentStageIndex = complaint ? getCurrentStageIndex(complaint.status) : -1;
  const showFeedback = complaint?.status === 'resolved';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Track Your Complaint</h1>
        <p className="text-slate-600">Enter your complaint ID to see real-time status updates</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter complaint ID (e.g., CVC2024001)"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="h-12 px-6">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
            Track
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Tip: Use the complaint ID you received when filing (e.g., CVC followed by numbers).
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
          Searching for your complaint...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {complaint && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Complaint Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Complaint Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Complaint ID</p>
                  <p className="font-bold text-lg text-blue-600">{complaint.complaint_id}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-slate-600">{complaint.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Category</p>
                    <p className="text-sm font-medium text-slate-900">{complaint.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Priority</p>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      complaint.priority === 'urgent' && 'bg-red-100 text-red-700',
                      complaint.priority === 'high' && 'bg-orange-100 text-orange-700',
                      complaint.priority === 'medium' && 'bg-amber-100 text-amber-700',
                      complaint.priority === 'low' && 'bg-green-100 text-green-700'
                    )}>
                      {complaint.priority.charAt(0).toUpperCase()}{complaint.priority.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="w-4 h-4" />
                  {complaint.department}
                </div>

                {complaint.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    {complaint.location}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Filed on {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                </div>

                {complaint.officer_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    Officer: {complaint.officer_name}
                  </div>
                )}

                {complaint.resolved_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    Resolved on {format(new Date(complaint.resolved_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-900">Progress Tracker</h2>
              </div>
              <div className="p-6">
                {/* Horizontal Timeline for Desktop */}
                <div className="hidden md:block mb-8">
                  <div className="relative">
                    <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{
                          width: currentStageIndex >= 0
                            ? `${((currentStageIndex + 1) / statusStages.length) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>

                    <div className="relative flex justify-between">
                      {statusStages.map((stage, index) => {
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        return (
                          <div key={stage.id} className="flex flex-col items-center">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300',
                                isCompleted
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                                  : 'bg-white border-2 border-slate-200 text-slate-400'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-6 h-6" />
                              ) : (
                                <Circle className="w-6 h-6" />
                              )}
                            </div>
                            <p className={cn(
                              'mt-3 text-xs font-medium text-center',
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                            )}>
                              {stage.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline for Mobile */}
                <div className="md:hidden space-y-0">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          event.completed
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        )}>
                          {event.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className={cn(
                            'w-0.5 h-16',
                            event.completed ? 'bg-blue-300' : 'bg-slate-200'
                          )} />
                        )}
                      </div>
                      <div className="pb-8">
                        <p className="font-medium text-slate-900">{event.label}</p>
                        <p className="text-sm text-slate-500">
                          {event.completed && event.ts
                            ? format(new Date(event.ts), 'MMM d, yyyy h:mm a')
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Timeline Details */}
                <div className="hidden md:block mt-8 border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-900">Activity Log</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {timeline.filter((e) => e.completed).map((event, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{event.label}</p>
                          {event.ts && (
                            <p className="text-xs text-slate-500">{format(new Date(event.ts), 'MMM d, yyyy h:mm a')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {complaint.officer_notes && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 text-sm">Officer Notes</p>
                          <p className="text-xs text-slate-600">{complaint.officer_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section (if resolved) */}
            {showFeedback && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl border border-blue-100 p-6 animate-fade-in">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Provide Feedback
                </h3>
                {feedbackSubmitted ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">
                      Thank you for your feedback of {feedbackRating} star{feedbackRating > 1 ? 's' : ''}!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-4">
                      Your complaint has been resolved. Please share your feedback to help us improve our services.
                    </p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={cn(
                            'w-10 h-10 rounded-lg border flex items-center justify-center transition-all',
                            feedbackRating >= star
                              ? 'bg-yellow-50 border-yellow-300'
                              : 'bg-white border-slate-200 hover:bg-yellow-50 hover:border-yellow-300'
                          )}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <svg
                            className={cn('w-6 h-6', feedbackRating >= star ? 'text-yellow-400 fill-current' : 'text-slate-300 fill-current')}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <Button onClick={handleSubmitFeedback} disabled={feedbackRating === 0} className="w-full sm:w-auto">
                      Submit Feedback
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!complaint && !loading && !error && searchId && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No complaint found with ID "{searchId}"</p>
          <p className="text-sm text-slate-400 mt-1">Please check the ID and try again</p>
        </div>
      )}

      {!complaint && !loading && !error && !searchId && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Enter your complaint ID above to track its status</p>
          <p className="text-sm text-slate-400 mt-1">Your complaint ID was provided when you filed the complaint</p>
        </div>
      )}
    </div>
  );
}
