import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  FileText,
  CheckCircle,
  Clock,
  Shield,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { officerStats } from '@/data/mockData';
import { OfficerResolutionPanel, type OfficerStats } from '@/components/OfficerResolutionPanel';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function OfficerDashboard() {
  const [officerName, setOfficerName] = useState<string>(
    () => localStorage.getItem('janseva.officerName') ?? ''
  );
  const [stats, setStats] = useState<OfficerStats | null>(null);

  useEffect(() => {
    const sync = () => setOfficerName(localStorage.getItem('janseva.officerName') ?? '');
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleStatsChange = (newStats: OfficerStats) => {
    setStats(newStats);
  };

  const displayName = officerName.trim() || 'Officer';
  const department = 'Field Operations';
  const statsReady = stats !== null;

  const statsCards = [
    {
      label: 'Total Complaints',
      value: statsReady ? stats!.total : null,
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Assigned',
      value: statsReady ? stats!.assigned : null,
      icon: Shield,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Pending',
      value: statsReady ? stats!.pending : null,
      icon: Clock,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Emergency',
      value: statsReady ? stats!.emergency : null,
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'Resolved',
      value: statsReady ? stats!.resolved : null,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
            <p className="text-slate-600">Monitor your assigned complaints and performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold">
              {officerName.trim() ? getInitials(officerName) : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-500">{department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {card.value === null ? (
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                ) : (
                  card.value
                )}
              </p>
              <p className="text-sm text-slate-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Resolution Panel (live complaints) */}
      <div className="mb-6">
        <OfficerResolutionPanel onStatsChange={handleStatsChange} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Monthly Performance</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={officerStats.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                <Line type="monotone" dataKey="assigned" stroke="#3b82f6" strokeWidth={2} name="Assigned" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Satisfaction Comparison */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Citizen Satisfaction Comparison</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={officerStats.departmentComparison}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="department" stroke="#64748b" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Radar name="Satisfaction %" dataKey="satisfaction" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
