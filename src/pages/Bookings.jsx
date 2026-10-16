import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiXCircle, FiCalendar, FiMapPin, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
    // Auto-refresh bookings every 10 seconds to check for status updates
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/user/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
    toast.success('Bookings updated!');
  };

  const cancelBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b)));
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const filteredBookings = selectedStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === selectedStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-600" />;
      case 'confirmed':
        return <FiCheckCircle className="text-blue-600" />;
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'cancelled':
        return <FiXCircle className="text-red-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-xl text-gray-600">View and manage your service bookings</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={manualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            <FiRefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </motion.div>

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 flex-wrap"
        >
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:shadow-md'
              }`}
            >
              {status}
            </motion.button>
          ))}
        </motion.div>

        {/* Status Legend */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Booking Status Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FiClock className="text-yellow-600" size={20} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Pending</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Waiting for provider response</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" size={20} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Confirmed</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Provider accepted your booking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-600" size={20} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Completed</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Service delivered successfully</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiXCircle className="text-red-600" size={20} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Cancelled</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Provider declined or you cancelled</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
          </div>
        ) : filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-2xl text-gray-500 font-semibold">No bookings yet</p>
            <p className="text-gray-400 mt-2">Start by exploring services and making your first booking</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filteredBookings.map(booking => (
              <motion.div
                key={booking._id}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                  {/* Service Info */}
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {booking.service?.title || booking.service?.name || 'Service'}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={16} className="text-blue-600" />
                        <span>
                          {new Date(booking.scheduledDate || booking.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {booking.service?.category && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700 capitalize">
                            {booking.service.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col justify-center">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border w-fit ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="font-semibold capitalize text-sm">{booking.status}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex flex-col justify-center items-end gap-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        TND {booking.price?.toFixed(2) || '0.00'}
                      </p>
                      {booking.platformFeeAmount !== undefined && (
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          <div>Platform: {booking.platformFeeAmount?.toFixed(2)} ({(booking.platformFeePercent * 100).toFixed(0)}%)</div>
                          <div className="text-green-600 font-semibold">Provider: {booking.providerEarning?.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => cancelBooking(booking._id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FiTrash2 size={16} /> Cancel
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 px-6 py-4 border-t flex gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-900">Booking ID:</span> {booking._id?.slice(-6)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Provider:</span> {booking.provider?.name || 'Provider'}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Count */}
        {!loading && filteredBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-gray-600"
          >
            <p>Showing {filteredBookings.length} of {bookings.length} bookings</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
