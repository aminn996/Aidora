import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiDollarSign, FiCheckCircle, FiX, FiSearch, FiTrendingUp, FiActivity, FiSettings, FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [commissionStats, setCommissionStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, commissionRes, bookingsRes, providersRes, usersRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/commission-stats'),
        api.get('/admin/bookings'),
        api.get('/admin/users?role=provider'),
        api.get('/admin/users'),
      ]);
      setStats(analyticsRes.data.stats);
      setCommissionStats(commissionRes.data);
      setBookings(bookingsRes.data.bookings);
      setProviders(providersRes.data.users);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommission = async (providerId, currentStatus) => {
    try {
      await api.put(`/admin/providers/${providerId}/commission`, {
        exempt: !currentStatus,
      });
      toast.success('Commission status updated');
      loadData();
    } catch (err) {
      console.error('Error updating commission:', err);
      toast.error('Failed to update commission status');
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(p => {
    if (providerFilter === 'all') return true;
    if (providerFilter === 'exempt') return p.providerProfile?.exemptFromCommission;
    if (providerFilter === 'paying') return !p.providerProfile?.exemptFromCommission;
    if (providerFilter === 'verified') return p.providerProfile?.verificationStatus === 'verified';
    if (providerFilter === 'pending') return p.providerProfile?.verificationStatus === 'pending';
    return true;
  });

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  const exportData = (type) => {
    let data, filename;
    if (type === 'bookings') {
      data = filteredBookings.map(b => ({
        ID: b._id,
        Service: b.service?.title,
        Customer: b.user?.name,
        Provider: b.provider?.name,
        Price: b.price,
        Commission: b.platformFeeAmount,
        Status: b.status,
        Date: new Date(b.date).toLocaleDateString(),
      }));
      filename = 'bookings.csv';
    } else if (type === 'providers') {
      data = filteredProviders.map(p => ({
        Name: p.name,
        Email: p.email,
        Rating: p.providerProfile?.rating || 0,
        Bookings: p.providerProfile?.completedBookings || 0,
        Commission: p.providerProfile?.exemptFromCommission ? 'Exempt' : 'Paying',
        Status: p.providerProfile?.verificationStatus || 'pending',
      }));
      filename = 'providers.csv';
    }
    
    if (data && data.length) {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      toast.success(`Exported ${data.length} records`);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/control"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
              >
                <FiDollarSign size={18} />
                Control Center
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FiRefreshCw size={18} />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
          {['overview', 'bookings', 'providers', 'users', 'commission'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FiUsers className="text-4xl opacity-80" />
                  <FiTrendingUp className="text-2xl opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.users}</div>
                <div className="text-sm opacity-90">Total Users</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FiCheckCircle className="text-4xl opacity-80" />
                  <FiActivity className="text-2xl opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.providers}</div>
                <div className="text-sm opacity-90">Active Providers</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FiDollarSign className="text-4xl opacity-80" />
                  <FiTrendingUp className="text-2xl opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.services}</div>
                <div className="text-sm opacity-90">Listed Services</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <FiCheckCircle className="text-4xl opacity-80" />
                  <FiActivity className="text-2xl opacity-60" />
                </div>
                <div className="text-4xl font-bold mb-1">{stats.bookings}</div>
                <div className="text-sm opacity-90">Total Bookings</div>
                <div className="text-xs opacity-75 mt-1">{stats.completedBookings} completed</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiDollarSign className="text-green-600" />
                  Revenue Overview
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {commissionStats?.stats.totalRevenue?.toFixed(2) || '0.00'} TND
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Platform Commission</div>
                    <div className="text-xl font-bold text-green-600">
                      {commissionStats?.stats.totalCommission?.toFixed(2) || '0.00'} TND
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Provider Earnings</div>
                    <div className="text-xl font-bold text-purple-600">
                      {commissionStats?.stats.totalProviderEarnings?.toFixed(2) || '0.00'} TND
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiActivity className="text-blue-600" />
                  Platform Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {stats.bookings > 0 ? ((stats.completedBookings / stats.bookings) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Avg per Booking</span>
                    <span className="font-bold text-green-600">
                      {commissionStats?.stats.bookingsCount > 0
                        ? (commissionStats.stats.totalRevenue / commissionStats.stats.bookingsCount).toFixed(2)
                        : '0.00'} TND
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Exempt Providers</span>
                    <span className="font-bold text-red-600">{commissionStats?.exemptProviders || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiUsers className="text-purple-600" />
                  User Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Provider Ratio</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {stats.users > 0 ? ((stats.providers / stats.users) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Regular Users</span>
                    <span className="font-bold text-blue-600">{stats.users - stats.providers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Providers</span>
                    <span className="font-bold text-green-600">{stats.providers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Center Quick Access */}
            <Link to="/admin/control">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white cursor-pointer mb-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <FiDollarSign className="text-3xl" />
                      Control Center
                    </h3>
                    <p className="text-green-100">Real-time operational view with pipeline and insights</p>
                  </div>
                  <div className="text-6xl opacity-20">⚙️</div>
                </div>
                <div className="mt-4 flex gap-6">
                  <div>
                    <div className="text-sm opacity-90">Booking pipeline</div>
                    <div className="text-xl font-bold">View dashboard</div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Bookings</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600">
                  <FiFilter size={18} className="text-gray-500" />
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportData('bookings')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiDownload size={18} />
                  Export
                </motion.button>
              </div>
            </div>
            <div className="grid gap-4">
              {filteredBookings.map(booking => (
              <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{booking.service?.title}</p>
                    <p className="text-xs text-gray-400">{booking.service?.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{booking.user?.name}</p>
                    <p className="text-xs text-gray-400">{booking.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Provider</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{booking.provider?.name}</p>
                    <p className="text-xs text-gray-400">{booking.provider?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pricing</p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{booking.price} TND</p>
                    <p className="text-xs text-green-600">Provider: {booking.providerEarning?.toFixed(2)} TND</p>
                    <p className="text-xs text-blue-600">Platform: {booking.platformFeeAmount?.toFixed(2)} TND</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className={`px-3 py-1 rounded-full capitalize ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                  <span className="text-gray-500">{new Date(booking.date).toLocaleDateString()}</span>
                  <span className="text-gray-400">ID: {booking._id.slice(-8)}</span>
                </div>
              </div>
            ))}
            </div>
          </motion.div>
        )}
        {/* Providers Tab */}
        {activeTab === 'providers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Providers Management</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px]">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600">
                  <FiFilter size={18} className="text-gray-500" />
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none"
                  >
                    <option value="all">All Providers</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="exempt">Commission Exempt</option>
                    <option value="paying">Paying Commission</option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportData('providers')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FiDownload size={18} />
                  Export
                </motion.button>
              </div>
            </div>
            <div className="grid gap-4">
              {filteredProviders.map(provider => (
                <div key={provider._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{provider.name}</h3>
                        {provider.providerProfile?.verificationStatus === 'verified' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                        {provider.providerProfile?.exemptFromCommission && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Commission Exempt
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{provider.email}</p>
                      <div className="mt-3 flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1 text-yellow-500">
                          ⭐ {provider.providerProfile?.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {provider.providerProfile?.completedBookings || 0} bookings
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {provider.providerProfile?.totalReviews || 0} reviews
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCommission(
                        provider._id,
                        provider.providerProfile?.exemptFromCommission
                      )}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        provider.providerProfile?.exemptFromCommission
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {provider.providerProfile?.exemptFromCommission ? (
                        <>
                          <FiX className="inline mr-2" />
                          Exempt
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="inline mr-2" />
                          Paying
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Users</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: {users.length} users
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">{u.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {u.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                    {u.phone && (
                      <span className="text-gray-500 dark:text-gray-400">{u.phone}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Commission Tab */}
        {activeTab === 'commission' && commissionStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header with Export */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Commission Management</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const commissionData = filteredProviders.map(p => ({
                    Provider: p.name,
                    Email: p.email,
                    Status: p.providerProfile?.verificationStatus || 'pending',
                    CommissionStatus: p.providerProfile?.exemptFromCommission ? 'Exempt' : 'Paying 10%',
                    Rating: p.providerProfile?.rating || 0,
                    CompletedBookings: p.providerProfile?.completedBookings || 0,
                  }));
                  const csv = [
                    Object.keys(commissionData[0]).join(','),
                    ...commissionData.map(r => Object.values(r).join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'commission-report.csv';
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FiDownload size={18} />
                Export Report
              </motion.button>
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-2">Total Revenue</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {commissionStats.stats.totalRevenue?.toFixed(2)} TND
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">All bookings</p>
                  </div>
                  <FiDollarSign className="text-blue-600 dark:text-blue-400" size={32} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border border-green-200 dark:border-green-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">Platform Commission</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {commissionStats.stats.totalCommission?.toFixed(2)} TND
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-2">10% from bookings</p>
                  </div>
                  <FiTrendingUp className="text-green-600 dark:text-green-400" size={32} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20 border border-purple-200 dark:border-purple-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-2">Provider Earnings</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {commissionStats.stats.totalProviderEarnings?.toFixed(2)} TND
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">90% to providers</p>
                  </div>
                  <FiActivity className="text-purple-600 dark:text-purple-400" size={32} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border border-orange-200 dark:border-orange-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-700 dark:text-orange-400 font-medium mb-2">Exempt Providers</div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {commissionStats.exemptProviders}
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">Commission exempt</p>
                  </div>
                  <FiCheckCircle className="text-orange-600 dark:text-orange-400" size={32} />
                </div>
              </motion.div>
            </div>

            {/* Commission Breakdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Commission Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {commissionStats.stats.bookingsCount}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Commission/Booking</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {commissionStats.stats.bookingsCount > 0
                      ? (commissionStats.stats.totalCommission / commissionStats.stats.bookingsCount).toFixed(2)
                      : '0.00'} TND
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Commission Rate</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">10%</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Platform Share</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {commissionStats.stats.totalRevenue > 0
                      ? ((commissionStats.stats.totalCommission / commissionStats.stats.totalRevenue) * 100).toFixed(1)
                      : '0'} %
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Provider Share</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {commissionStats.stats.totalRevenue > 0
                      ? ((commissionStats.stats.totalProviderEarnings / commissionStats.stats.totalRevenue) * 100).toFixed(1)
                      : '0'} %
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Providers</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {providers.length}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Top Earning Providers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Commission Status by Provider</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredProviders.map(provider => (
                  <div
                    key={provider._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{provider.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Completed: {provider.providerProfile?.completedBookings || 0} bookings
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                        <span
                          className={`text-sm font-bold ${
                            provider.providerProfile?.exemptFromCommission
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {provider.providerProfile?.exemptFromCommission ? 'Exempt' : 'Paying 10%'}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          toggleCommission(provider._id, provider.providerProfile?.exemptFromCommission)
                        }
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          provider.providerProfile?.exemptFromCommission
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {provider.providerProfile?.exemptFromCommission ? 'Set to Paying' : 'Exempt'}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
