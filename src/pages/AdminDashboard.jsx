import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/PremiumProvider';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Crown, TrendingUp, Wand2,
  RefreshCw, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#f43f5e', '#d4af37', '#3b82f6', '#10b981'];

function StatCard({ icon: Icon, label, value, sub, color = 'rose' }) {
  const colorMap = {
    rose: 'text-rose-400 bg-rose-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
  };
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-slate-400 text-xs mb-0.5">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = usePremium();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('adminMetrics', {});
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchMetrics();
  }, [user]);

  if (!user) return null;

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">This page is for admins only.</p>
        </div>
      </div>
    );
  }

  const pieData = data ? [
    { name: 'Free', value: data.summary.freeUsers },
    { name: 'Premium', value: data.summary.premiumUsers },
  ] : [];

  const platformData = data ? [
    { name: 'Web', value: data.summary.platformCounts.web },
    { name: 'Play Store', value: data.summary.platformCounts.playstore },
    { name: 'Amazon', value: data.summary.platformCounts.amazon },
    { name: 'Unknown', value: data.summary.platformCounts.unknown },
  ].filter(p => p.value > 0) : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Platform health & growth metrics</p>
          </div>
          <Button
            onClick={fetchMetrics}
            disabled={loading}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-rose-900/30 border border-rose-700 text-rose-300 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Users" value={data.summary.totalUsers.toLocaleString()} color="blue" />
              <StatCard icon={Crown} label="Premium Users" value={data.summary.premiumUsers.toLocaleString()} sub={`${data.summary.conversionRate}% conversion`} color="amber" />
              <StatCard icon={TrendingUp} label="Active Today" value={data.summary.activeToday.toLocaleString()} sub="credit resets" color="emerald" />
              <StatCard icon={Wand2} label="Recent Designs" value={data.summary.totalDesigns.toLocaleString()} sub="last 500 fetched" color="rose" />
            </div>

            {/* DAU + Signups Trend */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Daily Active Users & Signups (14 days)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="dau" name="DAU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="signups" name="Signups" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Designs Generated per Day */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Designs Generated Per Day (14 days)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  <Bar dataKey="designs" name="Designs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* Free vs Premium */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Free vs Premium</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    Free: {data.summary.freeUsers}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    Premium: {data.summary.premiumUsers}
                  </div>
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Platform Breakdown</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {platformData.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                      {p.name}: {p.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversion Rate Banner */}
            <div className="bg-gradient-to-r from-amber-900/40 to-rose-900/40 border border-amber-700/50 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-1">Free → Premium Conversion Rate</p>
              <p className="text-5xl font-bold text-amber-400">{data.summary.conversionRate}%</p>
              <p className="text-slate-400 text-sm mt-1">{data.summary.premiumUsers} of {data.summary.totalUsers} users are on Pro</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}