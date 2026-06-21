import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Loader2,
} from 'lucide-react';
import { mockAnalytics } from '@/data/mockData';
import { supabase, type Complaint } from '@/lib/supabase';
import { subscribeToComplaintChanges } from '@/lib/complaintEvents';
import { cn } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const RESOLVED_STATUSES = ['resolved'];

type LiveStats = {
  total: number;
  resolved: number;
  rate: number;
  avgDays: number;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATS: LiveStats = { total: 0, resolved: 0, rate: 0, avgDays: 0, loading: true, error: null };

function computeStats(rows: Complaint[]): LiveStats {
  const total = rows.length;
  const resolvedRows = rows.filter((r) => RESOLVED_STATUSES.includes(r.status));
  const resolved = resolvedRows.length;
  const rate = total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;
  const avgDays =
    resolvedRows.length === 0
      ? 0
      : Math.round(
          (resolvedRows.reduce((sum, r) => {
            if (!r.resolved_at || !r.created_at) return sum;
            const diff = new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime();
            return sum + Math.max(0, diff / (1000 * 60 * 60 * 24));
          }, 0) /
            resolvedRows.length) *
            10
        ) / 10;
  return { total, resolved, rate, avgDays, loading: false, error: null };
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<LiveStats>(EMPTY_STATS);

  const loadStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase
      .from('complaints')
      .select('id, status, created_at, resolved_at');

    if (error) {
      setStats({ ...EMPTY_STATS, loading: false, error: error.message });
      return;
    }
    setStats(computeStats((data ?? []) as Complaint[]));
  }, []);

  useEffect(() => {
    loadStats();
    // Auto-refresh when an officer updates a complaint status anywhere in the app.
    const unsubscribe = subscribeToComplaintChanges(loadStats);
    return unsubscribe;
  }, [loadStats]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Comprehensive analysis of citizen complaints and resolution metrics</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cn('w-2 h-2 rounded-full', stats.loading ? 'bg-amber-400 animate-pulse' : 'bg-green-500')} />
          {stats.loading ? 'Refreshing live stats…' : 'Live stats up to date'}
        </span>
      </div>

      {stats.error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Couldn't load live stats ({stats.error}). Showing sample figures below.
          </p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {stats.loading ? <Loader2 className="w-7 h-7 animate-spin text-slate-400" /> : stats.total}
          </p>
          <p className="text-sm text-slate-600">Total Complaints</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {stats.loading ? <Loader2 className="w-7 h-7 animate-spin text-slate-400" /> : stats.resolved}
          </p>
          <p className="text-sm text-slate-600">Resolved</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {stats.loading ? <Loader2 className="w-7 h-7 animate-spin text-slate-400" /> : `${stats.rate}%`}
          </p>
          <p className="text-sm text-slate-600">Resolution Rate</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {stats.loading ? <Loader2 className="w-7 h-7 animate-spin text-slate-400" /> : stats.avgDays}
          </p>
          <p className="text-sm text-slate-600">Avg. Resolution (days)</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Monthly Complaint Trend
            </h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalytics.monthlyTrend}>
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
                <Line
                  type="monotone"
                  dataKey="complaints"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Complaints"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Department */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Complaints by Department
            </h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAnalytics.complaintsByDepartment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="department" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" />
                <Bar dataKey="resolved" fill="#10b981" radius={[0, 4, 4, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Categories */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Complaint Categories
            </h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockAnalytics.complaintsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  label={(props: any) => `${props.category}: ${props.count}`}
                >
                  {mockAnalytics.complaintsByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {mockAnalytics.complaintsByCategory.map((item, index) => (
                <div key={item.category} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-600">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Priority Distribution
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockAnalytics.priorityDistribution.map((item) => {
                const colorMap: Record<string, string> = {
                  Low: 'bg-green-500',
                  Medium: 'bg-amber-500',
                  High: 'bg-orange-500',
                  Urgent: 'bg-red-500',
                };
                return (
                  <div key={item.priority} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{item.priority}</span>
                      <span className="text-sm text-slate-500">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', colorMap[item.priority])}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Placeholder */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Grievance Heatmap</h2>
          <p className="text-sm text-slate-500">Geographic distribution of complaints</p>
        </div>
        <div className="p-6">
          <div className="aspect-video bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
            <div className="text-center">
              <div className="grid grid-cols-10 gap-1 mb-4">
                {[...Array(100)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${Math.random() * 0.8 + 0.1})`,
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-500">This is a placeholder for an interactive map</p>
              <p className="text-xs text-slate-400">Would integrate with mapping API for real implementation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
