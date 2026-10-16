import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiDollarSign, FiTrendingUp, FiStar, FiCalendar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Home & Maintenance',
    price: 0,
    icon: '📋',
    location: { 
      type: 'Point', 
      coordinates: [10.1667, 36.8065], 
      address: 'Tunis, Tunisia',
      serviceRadius: 10
    },
    serviceType: 'onsite',
    currency: 'TND',
    priceType: 'fixed',
    tags: [],
    requirements: '',
    cancellationPolicy: '24 hours notice required',
    maxBookingsPerDay: 10,
    pricingTiers: [],
    images: [],
    videoUrl: '',
    faqs: [],
    availability: {
      schedule: {},
      exceptions: []
    }
  });

  const categories = [
    'Home & Maintenance',
    'Automotive',
    'Technology & Electronics',
    'Personal Care & Beauty',
    'Health & Wellness',
    'Education & Training',
    'Business & Freelance',
    'Events & Media',
    'Delivery & Logistics',
    'Construction & Outdoor',
    'Security & Safety',
    'Pet Services'
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load services
      const servicesRes = await api.get('/services');
      const allServices = servicesRes.data.services || [];
      const providerServices = allServices.filter(s => s.provider?._id === user?.id || s.provider === user?.id);
      setServices(providerServices);

      // Load bookings
      const bookingsRes = await api.get('/bookings');
      const allBookings = bookingsRes.data.bookings || [];
      const providerBookings = allBookings.filter(b => b.service?.provider === user?.id || b.provider === user?.id);
      setBookings(providerBookings);

      // Calculate statistics
      calculateStatistics(providerServices, providerBookings);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (providerServices, providerBookings) => {
    const completed = providerBookings.filter(b => b.status === 'completed').length;
    const totalBookings = providerBookings.length;
    
    const totalEarnings = providerBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice * 0.9), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = providerBookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt);
        return b.status === 'completed' && 
               bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + (b.totalPrice * 0.9), 0);

    const averageRating = providerServices.length > 0
      ? (providerServices.reduce((sum, s) => sum + (s.rating || 0), 0) / providerServices.length)
      : 0;

    const totalReviews = providerServices.reduce((sum, s) => sum + (s.totalReviews || 0), 0);

    setStatistics({
      totalEarnings,
      monthlyEarnings,
      totalBookings,
      completedBookings: completed,
      averageRating,
      totalReviews,
    });
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'Home & Maintenance',
      price: 0,
      icon: '📋',
      location: { 
        type: 'Point', 
        coordinates: [10.1667, 36.8065], 
        address: 'Tunis, Tunisia',
        serviceRadius: 10
      },
      serviceType: 'onsite',
      currency: 'TND',
      priceType: 'fixed',
      tags: [],
      requirements: '',
      cancellationPolicy: '24 hours notice required',
      maxBookingsPerDay: 10,
      pricingTiers: [],
      images: [],
      videoUrl: '',
      faqs: [],
      availability: {
        schedule: {},
        exceptions: []
      }
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || form.price <= 0) {
      toast.error('Please fill in all required fields (Title, Category, Price)');
      return;
    }

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        maxBookingsPerDay: Number(form.maxBookingsPerDay) || 10,
        location: {
          ...form.location,
          coordinates: form.location.coordinates.map(c => Number(c)),
          serviceRadius: Number(form.location.serviceRadius) || 10
        }
      };

      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast.success('Service updated successfully!');
      } else {
        await api.post('/services', payload);
        toast.success('Service created successfully!');
      }
      resetForm();
      setShowForm(false);
      loadDashboardData();
    } catch (err) {
      console.error('Error saving service:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save service';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (service) => {
    setForm(service);
    setEditingId(service._id);
    setShowForm(true);
    setActiveTab('services');
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await api.delete(`/services/${serviceId}`);
      toast.success('Service deleted successfully!');
      loadDashboardData();
    } catch (err) {
      console.error('Error deleting service:', err);
      toast.error('Failed to delete service');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Provider Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage services, track earnings, and view customer feedback</p>
        </motion.div>

        {/* Statistics Cards */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {/* Total Earnings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Earnings</p>
                  <p className="text-3xl font-bold text-aidora-green mt-2">{statistics.totalEarnings.toFixed(2)} TND</p>
                </div>
                <FiDollarSign className="text-aidora-green text-3xl opacity-20" />
              </div>
            </div>

            {/* Monthly Earnings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{statistics.monthlyEarnings.toFixed(2)} TND</p>
                </div>
                <FiTrendingUp className="text-blue-600 text-3xl opacity-20" />
              </div>
            </div>

            {/* Completed Bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Completed Bookings</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{statistics.completedBookings}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">of {statistics.totalBookings} total</p>
                </div>
                <FiCalendar className="text-purple-600 text-3xl opacity-20" />
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Rating</p>
                  <p className="text-3xl font-bold text-yellow-500 mt-2">{statistics.averageRating.toFixed(1)} ⭐</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{statistics.totalReviews} reviews</p>
                </div>
                <FiStar className="text-yellow-500 text-3xl opacity-20" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg overflow-x-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab('services'); setShowForm(false); }}
            className={`py-3 px-4 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-aidora-green text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Services
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab('bookings'); setShowForm(false); }}
            className={`py-3 px-4 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-aidora-green text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Bookings
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab('reviews'); setShowForm(false); }}
            className={`py-3 px-4 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-aidora-green text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Reviews
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab('profile'); setShowForm(false); }}
            className={`py-3 px-4 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-aidora-green text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Profile
          </motion.button>
        </div>

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <>
            {/* Add Service Button */}
            {!showForm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="mb-8 px-6 py-3 bg-gradient-to-r from-aidora-green to-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-shadow"
              >
                <FiPlus size={20} /> Add New Service
              </motion.button>
            )}

            {/* Form Section */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Edit Service' : 'Create New Service'}
                  </h2>
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Service Title *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., Professional Plumbing"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price (TND) *
                      </label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        You'll earn {form.price > 0 ? (form.price * 0.9).toFixed(2) : '0.00'} TND after 10% platform fee
                      </p>
                    </div>

                    {/* Icon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Icon (Emoji)
                      </label>
                      <input
                        type="text"
                        value={form.icon}
                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        placeholder="📋"
                        maxLength="2"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green text-2xl text-center"
                      />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location Address
                      </label>
                      <input
                        type="text"
                        value={form.location.address}
                        onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })}
                        placeholder="e.g., Tunis, Tunisia"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe your service in detail..."
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-aidora-green"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-aidora-green to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                    >
                      <FiCheck size={20} /> {editingId ? 'Update Service' : 'Create Service'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Services List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Services ({services.length})</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-aidora-green"></div>
                </div>
              ) : services.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No services created yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-aidora-green text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
                  >
                    Create Your First Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service, index) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">{service.icon || '📋'}</div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(service)}
                              className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                            >
                              <FiEdit2 size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(service._id)}
                              className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                            >
                              <FiTrash2 size={18} />
                            </motion.button>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{service.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{service.category}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{service.description}</p>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-2xl font-bold text-aidora-green">{service.price} TND</p>
                            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">You earn: {(service.price * 0.9).toFixed(2)} TND (90%)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{service.location?.address}</p>
                          </div>
                          {service.rating && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-yellow-500">⭐ {service.rating.toFixed(1)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{service.totalReviews} reviews</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Bookings ({bookings.length})</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-aidora-green"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Service</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-4 px-4 text-gray-900 dark:text-white">{booking.service?.title || 'N/A'}</td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white">{booking.user?.name || 'N/A'}</td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                        <td className="py-4 px-4 font-bold text-aidora-green">{(booking.totalPrice * 0.9).toFixed(2)} TND</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customer Reviews & Ratings</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-aidora-green"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 text-lg">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {services.map((service) => (
                  service.reviews && service.reviews.length > 0 ? (
                    <div key={service._id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{service.title}</h3>
                      <div className="space-y-4">
                        {service.reviews.map((review, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{review.userName || 'Anonymous'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-yellow-500 text-lg">{'⭐'.repeat(review.rating)}</div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
                {services.every(s => !s.reviews || s.reviews.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FiUser size={24} /> Provider Profile
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-aidora-green"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{user?.name}</p>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{user?.email}</p>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{user?.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verification Status</p>
                  <div className="mb-6">
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Verified Provider
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bank Account</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{user?.bankAccount || 'Not set up'}</p>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Need to update your profile?</p>
              <button className="px-6 py-3 bg-aidora-green text-white rounded-lg font-semibold hover:bg-emerald-600 transition">
                Edit Profile
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
