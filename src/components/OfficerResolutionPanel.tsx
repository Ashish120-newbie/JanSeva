import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  Filter,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle,
  RefreshCw,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase, type Complaint, type ComplaintStatus } from '@/lib/supabase';
import { notifyComplaintChanged } from '@/lib/complaintEvents';
import { cn } from '@/lib/utils';

const STATUS_FLOW: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  pending: 'Submitted',
};

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  assigned: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

type FilterStatus = ComplaintStatus | 'all';

export function OfficerResolutionPanel() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('submitted');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setComplaints([]);
    } else {
      setComplaints((data ?? []) as Complaint[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // When a complaint is opened, sync the drawer form to its current state.
  useEffect(() => {
    if (selected) {
      const normalized = (selected.status === 'pending' ? 'submitted' : selected.status) as ComplaintStatus;
      setNewStatus(STATUS_FLOW.includes(normalized) ? normalized : 'submitted');
      setNotes(selected.officer_notes ?? '');
      setSaveMessage(null);
    }
  }, [selected]);

  const visible = complaints.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'submitted' && c.status === 'pending') return true;
    return c.status === filter;
  });

  const summary = STATUS_FLOW.reduce(
    (acc, s) => {
      acc[s] = complaints.filter((c) =>
        s === 'submitted' ? c.status === 'submitted' || c.status === 'pending' : c.status === s
      ).length;
      return acc;
    },
    {} as Record<ComplaintStatus, number>
  );

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMessage(null);

    const payload = {
      status: newStatus,
      officer_notes: notes.trim() || null,
      officer_name: 'Rajesh Kumar',
    };

    const { data, error: updateError } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', selected.id)
      .select('*')
      .single();

    setSaving(false);

    if (updateError || !data) {
      setSaveMessage({ type: 'error', text: updateError?.message ?? 'Failed to update complaint.' });
      return;
    }

    const updated = data as Complaint;
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
    setSaveMessage({ type: 'success', text: `Status updated to "${STATUS_LABELS[newStatus]}".` });
    notifyComplaintChanged();
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-900">Officer Resolution Panel</h2>
          <p className="text-sm text-slate-500">Review complaints and advance their resolution status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Total: {complaints.length}</span>
          <Button variant="outline" size="sm" onClick={loadComplaints} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Status filter chips */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        <FilterChip label="All" count={complaints.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        {STATUS_FLOW.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABELS[s]}
            count={summary[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {error && (
        <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Failed to load complaints</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading complaints...
        </div>
      ) : visible.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No complaints match this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Complaint</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Filed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-blue-600">{complaint.complaint_id}</td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-sm font-medium text-slate-900 line-clamp-1">
                      {complaint.description.slice(0, 80) || '(no description)'}
                    </p>
                    <p className="text-xs text-slate-500">{complaint.category}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{complaint.department}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium capitalize',
                      PRIORITY_STYLES[complaint.priority]
                    )}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border',
                      STATUS_STYLES[complaint.status] ?? STATUS_STYLES.submitted
                    )}>
                      {STATUS_LABELS[complaint.status] ?? STATUS_LABELS.submitted}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(complaint)}>
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail + status update drawer */}
      {selected && (
        <ComplaintDetailDrawer
          complaint={selected}
          newStatus={newStatus}
          notes={notes}
          saving={saving}
          saveMessage={saveMessage}
          onStatusChange={setNewStatus}
          onNotesChange={setNotes}
          onSave={handleSave}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      )}
    >
      {label}
      <span className={cn(
        'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
        active ? 'bg-white/20' : 'bg-white text-slate-500'
      )}>
        {count}
      </span>
    </button>
  );
}

function ComplaintDetailDrawer({
  complaint,
  newStatus,
  notes,
  saving,
  saveMessage,
  onStatusChange,
  onNotesChange,
  onSave,
  onClose,
}: {
  complaint: Complaint;
  newStatus: ComplaintStatus;
  notes: string;
  saving: boolean;
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  onStatusChange: (status: ComplaintStatus) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const currentIndex = STATUS_FLOW.indexOf(
    (complaint.status === 'pending' ? 'submitted' : complaint.status) as ComplaintStatus
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Complaint</p>
            <h3 className="font-mono font-semibold text-slate-900">{complaint.complaint_id}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Citizen + meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField icon={User} label="Citizen" value={complaint.citizen_name} />
            <DetailField icon={Mail} label="Email" value={complaint.email} />
            <DetailField icon={Phone} label="Contact" value={complaint.contact_number ?? '—'} />
            <DetailField icon={MapPin} label="Location" value={complaint.location ?? '—'} />
            <DetailField icon={Building2} label="Department" value={complaint.department} />
            <DetailField icon={Calendar} label="Filed" value={format(new Date(complaint.created_at), 'MMM d, yyyy • h:mm a')} />
          </div>

          {/* Priority + AI summary */}
          <div className="flex items-center gap-3">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
              PRIORITY_STYLES[complaint.priority]
            )}>
              {complaint.priority} priority
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {complaint.category}
            </span>
          </div>

          {complaint.ai_summary && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Summary
              </p>
              <p className="text-sm text-slate-700">{complaint.ai_summary}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Workflow stepper */}
          <div className="border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Resolution Workflow</p>
            <div className="flex items-center justify-between">
              {STATUS_FLOW.map((step, i) => {
                const reached = currentIndex >= 0 && i <= currentIndex;
                const isCurrent = newStatus === step;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {i > 0 && (
                      <div
                        className={cn(
                          'absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2',
                          reached ? 'bg-blue-500' : 'bg-slate-200'
                        )}
                      />
                    )}
                    <button
                      onClick={() => onStatusChange(step)}
                      className={cn(
                        'relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                        isCurrent
                          ? 'bg-blue-600 text-white scale-110 ring-2 ring-blue-200'
                          : reached
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      )}
                    >
                      {i + 1}
                    </button>
                    <span className={cn(
                      'mt-1.5 text-[10px] font-medium text-center leading-tight',
                      isCurrent ? 'text-blue-700' : 'text-slate-500'
                    )}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status select (fallback to stepper for accessibility) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Set status</label>
            <select
              value={newStatus}
              onChange={(e) => onStatusChange(e.target.value as ComplaintStatus)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Officer notes</label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add context about this status change (visible in the audit trail)..."
              className="min-h-[100px]"
            />
          </div>

          {saveMessage && (
            <div className={cn(
              'rounded-xl p-3 flex items-start gap-2 text-sm',
              saveMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            )}>
              {saveMessage.type === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Update'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}
