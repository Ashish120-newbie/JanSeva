import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Lock,
  Edit2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, type Complaint } from '@/lib/supabase';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PROFILE_STORAGE_KEY = 'janseva.profile';

const DEFAULT_PROFILE = {
  name: 'Guest User',
  email: 'guest@example.com',
  phone: '',
  address: '',
  aadhaar: '',
  dob: '1990-01-01',
};

function loadProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  } catch {
    // Fall through to default
  }
  return DEFAULT_PROFILE;
}

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(loadProfile);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const loadComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    setComplaintsError(null);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .ilike('email', profile.email)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      setComplaintsError(error.message);
      setComplaints([]);
    } else {
      setComplaints((data ?? []) as Complaint[]);
    }
    setLoadingComplaints(false);
  }, [profile.email]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleSave = () => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setIsEditing(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch {
      setComplaintsError('Failed to save profile. Please try again.');
    }
  };

  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved').length;
  const activeComplaints = complaints.filter((c) => c.status !== 'resolved').length;

  const settingsPanels: Record<string, { title: string; description: string }> = {
    notifications: {
      title: 'Notification Preferences',
      description: 'Manage how you receive alerts about complaint updates, scheme deadlines, and emergency notices.',
    },
    privacy: {
      title: 'Privacy & Security',
      description: 'Your data is protected under the Digital Personal Data Protection Act. Aadhaar details are masked and verified.',
    },
    verification: {
      title: 'Account Verification',
      description: 'Your identity is verified via Aadhaar. Contact your nearest CSC to update verification details.',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600">Manage your personal information and preferences</p>
      </div>

      {saveToast && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-800 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          Profile saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-500 to-sky-600" />
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
              </div>

              <div className="pt-16">
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <p className="text-slate-500 text-sm">Citizen</p>

                <div className="mt-4 space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {profile.address}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{loadingComplaints ? '—' : resolvedComplaints}</p>
                      <p className="text-xs text-slate-500">Resolved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{loadingComplaints ? '—' : activeComplaints}</p>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Quick Settings</h3>
            </div>
            <div className="p-4 space-y-1">
              <button
                onClick={() => setSettingsOpen(settingsOpen === 'notifications' ? null : 'notifications')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  settingsOpen === 'notifications' ? 'bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">Notifications</span>
              </button>
              <button
                onClick={() => setSettingsOpen(settingsOpen === 'privacy' ? null : 'privacy')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  settingsOpen === 'privacy' ? 'bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                <Lock className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">Privacy & Security</span>
              </button>
              <button
                onClick={() => setSettingsOpen(settingsOpen === 'verification' ? null : 'verification')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                  settingsOpen === 'verification' ? 'bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">Account Verification</span>
              </button>

              {settingsOpen && settingsPanels[settingsOpen] && (
                <div className="mt-2 p-4 bg-slate-50 rounded-xl animate-fade-in">
                  <p className="font-medium text-slate-800 text-sm">{settingsPanels[settingsOpen].title}</p>
                  <p className="text-xs text-slate-600 mt-1">{settingsPanels[settingsOpen].description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Personal Information</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{profile.phone || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{format(new Date(profile.dob), 'MMMM d, yyyy')}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-1">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-900">{profile.address || '—'}</p>
                )}
              </div>

              {profile.aadhaar && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Aadhaar Number</label>
                  <p className="text-slate-900">{profile.aadhaar}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            </div>

            {loadingComplaints ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading your complaints...
              </div>
            ) : complaintsError ? (
              <div className="p-6 flex items-start gap-3 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{complaintsError}</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No complaints filed yet.</p>
                <Link to="/file-complaint" className="text-blue-600 text-sm font-medium hover:underline mt-1 inline-block">
                  File your first complaint
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    to={`/track?id=${complaint.complaint_id}`}
                    className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {complaint.description.slice(0, 60) || complaint.complaint_id}
                        </p>
                        <p className="text-sm text-slate-500">
                          {complaint.complaint_id} • {complaint.department}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-medium text-slate-700 capitalize">
                          {complaint.status.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
