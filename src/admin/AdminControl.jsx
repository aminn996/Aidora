import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminControl() {
  const [stats, setStats] = useState(null);
  const [commissionStats, setCommissionStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      const [analyticsRes, commissionRes, bookingsRes, providersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/commission-stats'),
        api.get('/admin/bookings'),
        api.get('/admin/users?role=provider'),
      ]);

      setStats(analyticsRes.data.stats);
      setCommissionStats(commissionRes.data);
      setBookings(bookingsRes.data.bookings || []);
      setProviders(providersRes.data.users || []);
    } catch (err) {
      console.error('Error loading control data:', err);
      toast.error('Unable to load admin control data');
    } finally {
      setLoading(false);
    }
  };

  const pipeline = useMemo(() => {
    const base = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      const key = b.status || 'pending';
      if (base[key] !== undefined) base[key] += 1;
    });
    return base;
  }, [bookings]);

  const topProviders = useMemo(() => {
    return [...providers]
      .sort((a, b) => (b?.providerProfile?.rating || 0) - (a?.providerProfile?.rating || 0))
      .slice(0, 5);
  }, [providers]);

  const latestBookings = useMemo(() => bookings.slice(0, 6), [bookings]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-300">
          <div className="h-12 w-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin" />
          <span className="font-semibold">Preparing the control center…</span>
        </div>
      </div>
    );
  }

  const completionRate = stats.bookings > 0 ? ((stats.completedBookings / stats.bookings) * 100).toFixed(1) : '0.0';
  const revenue = commissionStats?.stats?.totalRevenue || 0;
  const commission = commissionStats?.stats?.totalCommission || 0;
  const providerEarnings = commissionStats?.stats?.totalProviderEarnings || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 py-10 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300 font-semibold">Control Center</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Operational Command</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Live snapshot of performance, pipeline, and provider health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Back to overview
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={refresh}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md hover:bg-blue-700"
            >
              <FiRefreshCw /> Refresh data
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: 'Platform Revenue',
              value: `${revenue.toFixed(2)} TND`,
              icon: <FiDollarSign />,
              accent: 'from-emerald-500 to-teal-500',
            },
            {
              title: 'Commission Collected',
              value: `${commission.toFixed(2)} TND`,
              icon: <FiTrendingUp />,
              accent: 'from-blue-500 to-indigo-500',
            },
            {
              title: 'Completion Rate',
              value: `${completionRate}%`,
              icon: <FiCheckCircle />,
              accent: 'from-purple-500 to-fuchsia-500',
            },
            {
              title: 'Active Providers',
              value: stats.providers,
              icon: <FiUsers />,
              accent: 'from-amber-500 to-orange-500',
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -4 }}
              className={`rounded-2xl bg-gradient-to-br ${card.accent} text-white p-5 shadow-lg flex items-center justify-between`}
            >
              <div>
                <p className="text-sm opacity-80">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="text-4xl opacity-80">{card.icon}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Bookings pipeline</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Live status</h3>
              </div>
              <FiActivity className="text-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[{ key: 'pending', label: 'Pending', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
                { key: 'confirmed', label: 'Confirmed', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
                { key: 'completed', label: 'Completed', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
                { key: 'cancelled', label: 'Cancelled', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200' }]
                .map((item) => (
                  <div key={item.key} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700">
                    <p className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${item.tone}`}>{item.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pipeline[item.key]}</p>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Alerts</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Operational focus</h3>
              </div>
              <FiAlertTriangle className="text-amber-500" />
            </div>
            <div className="space-y-3">
              <AlertRow
                icon={<FiClock />}
                label="Pending bookings older than 48h"
                value={bookings.filter((b) => b.status === 'pending').length}
                tone="amber"
              />
              <AlertRow
                icon={<FiStar />}
                label="Providers needing verification"
                value={providers.filter((p) => p?.providerProfile?.verificationStatus === 'pending').length}
                tone="blue"
              />
              <AlertRow
                icon={<FiUsers />}
                label="Providers exempt from commission"
                value={commissionStats?.exemptProviders || 0}
                tone="purple"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Recent activity</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Latest bookings</h3>
              </div>
              <FiArrowRight className="text-blue-500" />
            </div>
            <div className="space-y-4">
              {latestBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{booking.service?.title || 'Service'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.user?.name || 'Customer'} → {booking.provider?.name || 'Provider'}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(booking.date).toLocaleString()}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{booking.price?.toFixed?.(2) || '0.00'} TND</span>
                  </div>
                </div>
              ))}
              {latestBookings.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No bookings recorded yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">People</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Provider leaderboard</h3>
              </div>
              <FiTrendingUp className="text-emerald-500" />
            </div>
            <div className="space-y-3">
              {topProviders.map((p, idx) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-amber-500 font-semibold justify-end">
                      <FiStar /> {p?.providerProfile?.rating?.toFixed?.(1) || '0.0'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p?.providerProfile?.completedBookings || 0} completed</p>
                  </div>
                </div>
              ))}
              {topProviders.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No providers available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Actions</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quick action board</h3>
            </div>
            <FiArrowRight className="text-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              title="Review pending bookings"
              description="Follow up on pending and confirmed bookings older than 48h."
              count={pipeline.pending + pipeline.confirmed}
              accent="from-amber-500 to-orange-500"
              href="/admin"
            />
            <ActionCard
              title="Verify providers"
              description="Approve or reject provider verification requests."
              count={providers.filter((p) => p?.providerProfile?.verificationStatus === 'pending').length}
              accent="from-blue-500 to-indigo-500"
              href="/admin"
            />
            <ActionCard
              title="Commission review"
              description="Check exempt providers and adjust commission policies."
              count={commissionStats?.exemptProviders || 0}
              accent="from-purple-500 to-fuchsia-500"
              href="/admin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
      {status || 'pending'}
    </span>
  );
}

function AlertRow({ icon, label, value, tone }) {
  const tones = {
    amber: 'text-amber-500 bg-amber-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tones[tone]}`}>
        {icon}
      </div>
      <div className="flex-1 px-3">
        <p className="font-semibold text-gray-900 dark:text-white leading-tight">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Actionable insight</p>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function ActionCard({ title, description, count, accent, href }) {
  return (
    <Link
      to={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} text-white p-5 shadow-lg transition transform hover:-translate-y-1`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Open task</p>
          <h4 className="text-lg font-semibold leading-tight">{title}</h4>
        </div>
        <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold">
          {count}
        </div>
      </div>
      <p className="mt-3 text-sm opacity-90 max-w-xs">{description}</p>
    </Link>
  );
}
